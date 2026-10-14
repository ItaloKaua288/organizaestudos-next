import mongoose from "mongoose";
import StudyCycle from "../models/studyCycle.model.js";
import CycleHistory from "../models/cycleHistory.model.js";
import Subject from "../models/subject.model.js";
import QuestionLog from "../models/questionLog.model.js";
import { subjectScope } from "../middleware/profile.js";
import { parseQuestionEntries } from "./questionLog.controller.js";

/*
 * REGRAS DO CICLO DE ESTUDOS
 * - A ordem de `sessions` é a ordem oficial; o ciclo é uma fila circular.
 * - A posição atual (`currentSessionId`) só muda quando o estudante conclui/pula uma sessão
 *   (ou edita/reinicia o ciclo). Passagem de dias NUNCA altera nada.
 * - Concluir: marca CONCLUIDA, conta no total, grava no histórico e avança.
 * - Pular: marca PULADA (não conta como concluída nem no percentual), grava no histórico e avança.
 * - Iniciar: PENDENTE -> EM_ANDAMENTO. Cancelar: EM_ANDAMENTO -> PENDENTE (nada é contabilizado).
 *   Sair no meio de uma sessão preserva o estado EM_ANDAMENTO até concluir, pular ou cancelar.
 * - Ao terminar a última sessão da volta, nasce uma nova volta (lap + 1) com tudo PENDENTE.
 * - Editar: preserva o status das sessões existentes (por id) e a posição atual quando possível.
 *   Trocar a matéria de uma sessão em andamento a cancela.
 * - Reiniciar volta: lap + 1, tudo PENDENTE, volta para a primeira sessão (histórico preservado).
 * - Matérias desativadas/removidas: suas sessões ficam fora do percentual e são ignoradas ao avançar.
 * - Questões: ao concluir, o corpo pode trazer `questions: [{ topic_id, total, correct }]` (assuntos da
 *   matéria da sessão). Elas viram registros de QuestionLog, base do % de acerto por assunto/matéria.
 *   Tudo é validado ANTES de avançar o ciclo, e só é gravado se a sessão foi contabilizada agora.
 * - Idempotência: concluir/pular exigem { sessionId, lap } da sessão atual. Um clique duplicado
 *   encontra outra sessão como atual e vira no-op (409 com o estado atual). Além disso há
 *   optimisticConcurrency no ciclo e índice único no histórico (ciclo + volta + sessão).
 */

const OPEN_STATUS = ["PENDENTE", "EM_ANDAMENTO"];
const MAX_SESSIONS = 50;

const isId = (v) => mongoose.isValidObjectId(v);

// Cada perfil tem o próprio ciclo e só enxerga as matérias do próprio perfil.
const cycleScope = (req) => ({ user_id: req.userId, profile_id: req.profileId });

const loadSubjectMap = async (req) => {
    const subjects = await Subject.find(subjectScope(req)).select("title color active").lean();
    return new Map(subjects.map((s) => [String(s._id), s]));
};

const isUsable = (session, subjectMap) => {
    const subject = subjectMap.get(String(session.subject_id));
    return !!subject && subject.active !== false;
};

const startNewLap = (cycle, firstSession) => {
    cycle.lap += 1;
    cycle.sessions.forEach((s) => {
        s.status = "PENDENTE";
        s.startedAt = null;
    });
    cycle.currentSessionId = firstSession ? firstSession._id : null;
};

// Garante que a posição atual aponte para uma sessão válida e pendente.
const resolvePointer = (cycle, subjectMap) => {
    const usable = cycle.sessions.filter((s) => isUsable(s, subjectMap));

    if (usable.length === 0) {
        cycle.currentSessionId = null;
        return;
    }

    const current = usable.find((s) => String(s._id) === String(cycle.currentSessionId));
    if (current && OPEN_STATUS.includes(current.status)) return;

    const next = usable.find((s) => OPEN_STATUS.includes(s.status));
    if (next) {
        cycle.currentSessionId = next._id;
        return;
    }

    // Todas finalizadas: a última sessão leva à primeira da próxima volta.
    startNewLap(cycle, usable[0]);
};

const buildView = async (cycle, subjectMap) => {
    const sessions = cycle.sessions.map((s) => {
        const subject = subjectMap.get(String(s.subject_id));
        return {
            id: String(s._id),
            subject: {
                id: String(s.subject_id),
                title: subject ? subject.title : "Matéria removida",
                color: subject ? subject.color : "#6b7280",
            },
            duration: s.duration,
            status: s.status,
            startedAt: s.startedAt,
            inactive: !subject || subject.active === false,
            removed: !subject,
        };
    });

    const counted = sessions.filter((s) => !s.inactive);
    const completed = counted.filter((s) => s.status === "CONCLUIDA").length;
    const skipped = counted.filter((s) => s.status === "PULADA").length;

    const history = await CycleHistory.find({ cycle_id: cycle._id })
        .sort({ finishedAt: -1 })
        .limit(20)
        .lean();

    return {
        id: String(cycle._id),
        lap: cycle.lap,
        sessionsPerDay: cycle.sessionsPerDay ?? 0,
        totalCompleted: cycle.totalCompleted,
        currentSessionId: cycle.currentSessionId ? String(cycle.currentSessionId) : null,
        sessions,
        progress: {
            completed,
            skipped,
            total: counted.length,
            percent: counted.length ? Math.round((completed / counted.length) * 100) : 0,
        },
        history: history.map((h) => ({
            id: String(h._id),
            subjectTitle: h.subject_title,
            subjectColor: h.subject_color,
            lap: h.lap,
            duration: h.duration,
            status: h.status,
            finishedAt: h.finishedAt,
        })),
    };
};

const respond = async (res, status, cycle, subjectMap, extra = {}) => {
    const view = await buildView(cycle, subjectMap);
    return res.status(status).json({ success: true, cycle: view, ...extra });
};

const handleError = (res, error, label) => {
    if (error?.name === "VersionError") {
        return res.status(409).json({ success: false, conflict: true, message: "O ciclo foi atualizado em outro lugar. Atualize a página." });
    }
    console.log(`error in ${label} `, error);
    return res.status(500).json({ success: false, message: "Server error" });
};

// Carrega o ciclo + matérias e normaliza a posição. Responde 404 quando não existe.
const loadCycle = async (req, res) => {
    const cycle = await StudyCycle.findOne(cycleScope(req));
    if (!cycle) {
        res.status(404).json({ success: false, message: "Você ainda não criou um ciclo de estudos." });
        return null;
    }
    const subjectMap = await loadSubjectMap(req);
    resolvePointer(cycle, subjectMap);
    return { cycle, subjectMap };
};

export const getCycle = async (req, res) => {
    try {
        const cycle = await StudyCycle.findOne(cycleScope(req));
        if (!cycle) return res.status(200).json({ success: true, cycle: null });

        const subjectMap = await loadSubjectMap(req);
        resolvePointer(cycle, subjectMap);

        // Só persiste se a normalização mudou algo (ex.: matéria desativada). Falha de concorrência é inofensiva aqui.
        if (cycle.isModified()) {
            try { await cycle.save(); } catch (e) { if (e?.name !== "VersionError") throw e; }
        }

        return await respond(res, 200, cycle, subjectMap);
    } catch (error) {
        return handleError(res, error, "getCycle");
    }
};

export const saveCycle = async (req, res) => {
    try {
        const { sessions, sessionsPerDay } = req.body;

        // Opcional: se não vier (ex.: ao reordenar), mantém o valor atual. 0 = sem divisão por dia.
        if (sessionsPerDay !== undefined && (!Number.isInteger(sessionsPerDay) || sessionsPerDay < 0 || sessionsPerDay > 50)) {
            return res.status(400).json({ success: false, message: "Matérias por dia deve ser um número inteiro de 0 a 50." });
        }

        if (!Array.isArray(sessions) || sessions.length === 0 || sessions.length > MAX_SESSIONS) {
            return res.status(400).json({ success: false, message: `O ciclo precisa ter de 1 a ${MAX_SESSIONS} sessões.` });
        }

        const subjectMap = await loadSubjectMap(req);
        let cycle = await StudyCycle.findOne(cycleScope(req));
        const existing = new Map((cycle?.sessions ?? []).map((s) => [String(s._id), s]));
        const seenIds = new Set();
        const next = [];

        for (const item of sessions) {
            const duration = Number(item?.duration);
            if (!Number.isInteger(duration) || duration < 1 || duration > 720) {
                return res.status(400).json({ success: false, message: "A duração de cada sessão deve ser de 1 a 720 minutos." });
            }
            if (!isId(item?.subject_id)) {
                return res.status(400).json({ success: false, message: "Selecione a matéria de todas as sessões." });
            }

            const subjectId = String(item.subject_id);
            const subject = subjectMap.get(subjectId);
            const old = item.id && existing.has(String(item.id)) ? existing.get(String(item.id)) : null;

            if (old) {
                if (seenIds.has(String(old._id))) {
                    return res.status(400).json({ success: false, message: "Sessão duplicada na requisição." });
                }
                seenIds.add(String(old._id));
                // Sessão cuja matéria foi removida e que não foi alterada: descarta em silêncio.
                if (!subject && String(old.subject_id) === subjectId) continue;
            }

            if (!subject) return res.status(404).json({ success: false, message: "Matéria não encontrada." });

            const subjectChanged = !old || String(old.subject_id) !== subjectId;
            if (subjectChanged && subject.active === false) {
                return res.status(403).json({ success: false, message: `A matéria "${subject.title}" está desativada. Reative-a para usá-la no ciclo.` });
            }

            next.push({
                _id: old ? old._id : new mongoose.Types.ObjectId(),
                subject_id: subject._id,
                duration,
                // Trocar a matéria de uma sessão em andamento a cancela.
                status: old && !(subjectChanged && old.status === "EM_ANDAMENTO") ? old.status : "PENDENTE",
                startedAt: old && !(subjectChanged && old.status === "EM_ANDAMENTO") ? old.startedAt : null,
            });
        }

        if (next.length === 0) {
            return res.status(400).json({ success: false, message: "O ciclo precisa ter pelo menos uma sessão." });
        }

        if (!cycle) {
            cycle = new StudyCycle({ user_id: req.userId, profile_id: req.profileId, sessions: next, lap: 1, totalCompleted: 0, sessionsPerDay: sessionsPerDay ?? 0 });
            cycle.currentSessionId = next[0]._id;
        } else {
            cycle.sessions = next;
            if (sessionsPerDay !== undefined) cycle.sessionsPerDay = sessionsPerDay;
        }

        resolvePointer(cycle, subjectMap);
        const created = cycle.isNew;
        await cycle.save();

        return await respond(res, created ? 201 : 200, cycle, subjectMap);
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ success: false, conflict: true, message: "O ciclo já existe. Atualize a página." });
        }
        return handleError(res, error, "saveCycle");
    }
};

export const deleteCycle = async (req, res) => {
    try {
        const cycle = await StudyCycle.findOneAndDelete(cycleScope(req));
        if (!cycle) return res.status(404).json({ success: false, message: "Ciclo não encontrado." });

        await CycleHistory.deleteMany({ cycle_id: cycle._id });
        return res.status(200).json({ success: true, message: "Ciclo excluído com sucesso." });
    } catch (error) {
        return handleError(res, error, "deleteCycle");
    }
};

// Valida que a requisição se refere à sessão atual da volta atual (proteção contra duplo clique).
const isStale = (cycle, { sessionId, lap }) => {
    if (!isId(sessionId)) return true;
    if (String(cycle.currentSessionId) !== String(sessionId)) return true;
    return lap !== undefined && Number(lap) !== cycle.lap;
};

const staleResponse = (res, cycle, subjectMap) =>
    respond(res, 409, cycle, subjectMap, {
        stale: true,
        message: "Essa sessão já foi atualizada. Mostrando a posição atual do ciclo.",
    }).catch(() => null);

export const startSession = async (req, res) => {
    try {
        const loaded = await loadCycle(req, res);
        if (!loaded) return;
        const { cycle, subjectMap } = loaded;

        if (isStale(cycle, req.body)) return await staleResponse(res, cycle, subjectMap);

        const session = cycle.sessions.id(cycle.currentSessionId);
        if (session.status === "PENDENTE") {
            session.status = "EM_ANDAMENTO";
            session.startedAt = new Date();
        }

        await cycle.save();
        return await respond(res, 200, cycle, subjectMap, { message: "Sessão iniciada." });
    } catch (error) {
        return handleError(res, error, "startSession");
    }
};

export const cancelSession = async (req, res) => {
    try {
        const loaded = await loadCycle(req, res);
        if (!loaded) return;
        const { cycle, subjectMap } = loaded;

        if (isStale(cycle, req.body)) return await staleResponse(res, cycle, subjectMap);

        const session = cycle.sessions.id(cycle.currentSessionId);
        if (session.status === "EM_ANDAMENTO") {
            session.status = "PENDENTE";
            session.startedAt = null;
        }

        await cycle.save();
        return await respond(res, 200, cycle, subjectMap, { message: "Sessão cancelada. Nada foi contabilizado." });
    } catch (error) {
        return handleError(res, error, "cancelSession");
    }
};

const finishSession = (status, successMessage, label) => async (req, res) => {
    try {
        const loaded = await loadCycle(req, res);
        if (!loaded) return;
        const { cycle, subjectMap } = loaded;

        if (isStale(cycle, req.body)) return await staleResponse(res, cycle, subjectMap);

        const lap = cycle.lap;
        const session = cycle.sessions.id(cycle.currentSessionId);
        const subject = subjectMap.get(String(session.subject_id));
        const finishedAt = new Date();
        const startedAt = session.startedAt; // capturado antes: uma nova volta zera startedAt

        // Questões feitas na sessão (opcional, só ao concluir). Validadas antes de mexer no ciclo.
        let questionEntries = [];
        const rawQuestions = req.body?.questions;
        if (status === "CONCLUIDA" && Array.isArray(rawQuestions) && rawQuestions.length > 0) {
            const parsed = await parseQuestionEntries(rawQuestions, req.userId, session.subject_id);
            if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
            questionEntries = parsed.entries;
        }

        session.status = status;
        if (status === "CONCLUIDA") cycle.totalCompleted += 1;

        resolvePointer(cycle, subjectMap); // avança (ou abre nova volta após a última sessão)

        // O save com controle de versão é a trava principal: se outro clique já avançou, lança VersionError.
        await cycle.save();

        try {
            await CycleHistory.create({
                user_id: req.userId,
                cycle_id: cycle._id,
                session_id: session._id,
                subject_id: session.subject_id,
                subject_title: subject?.title ?? "",
                subject_color: subject?.color ?? "#000000",
                lap,
                duration: session.duration,
                status,
                startedAt,
                finishedAt,
            });

            if (questionEntries.length > 0) {
                await QuestionLog.insertMany(questionEntries.map((entry) => ({
                    user_id: req.userId,
                    subject_id: entry.subject_id,
                    topic_id: entry.topic_id,
                    total: entry.total,
                    correct: entry.correct,
                    cycle_id: cycle._id,
                    session_id: session._id,
                    lap,
                    answeredAt: finishedAt,
                })));
            }
        } catch (e) {
            if (e?.code !== 11000) throw e; // já registrada nesta volta (as questões não são gravadas de novo)
        }

        return await respond(res, 200, cycle, subjectMap, { message: successMessage });
    } catch (error) {
        if (error?.name === "VersionError") {
            // Outro clique/aba já avançou o ciclo: devolve a posição atual sem contabilizar de novo.
            const fresh = await StudyCycle.findOne(cycleScope(req));
            if (fresh) {
                const subjectMap = await loadSubjectMap(req);
                return await staleResponse(res, fresh, subjectMap);
            }
        }
        return handleError(res, error, label);
    }
};

export const completeSession = finishSession("CONCLUIDA", "Sessão concluída!", "completeSession");
export const skipSession = finishSession("PULADA", "Sessão pulada.", "skipSession");

export const restartLap = async (req, res) => {
    try {
        const loaded = await loadCycle(req, res);
        if (!loaded) return;
        const { cycle, subjectMap } = loaded;

        const first = cycle.sessions.find((s) => isUsable(s, subjectMap));
        startNewLap(cycle, first);

        await cycle.save();
        return await respond(res, 200, cycle, subjectMap, { message: "Volta reiniciada." });
    } catch (error) {
        return handleError(res, error, "restartLap");
    }
};

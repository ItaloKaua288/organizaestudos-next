import mongoose from "mongoose";
import QuestionLog from "../models/questionLog.model.js";
import Subject from "../models/subject.model.js";
import Topic from "../models/topic.model.js";

const MAX_QUESTIONS = 10000;
const MAX_ENTRIES = 30;

const isId = (v) => mongoose.isValidObjectId(v);

const percentOf = (correct, total) => (total > 0 ? Math.round((correct / total) * 1000) / 10 : 0);

/**
 * Valida e normaliza uma lista de { topic_id, total, correct } e confere que todos os
 * assuntos pertencem ao usuário (e a matérias ativas). Retorna { entries } ou { error }.
 * Quando `subjectId` é informado, todos os assuntos precisam ser dessa matéria.
 */
export const parseQuestionEntries = async (rawEntries, userId, subjectId = null) => {
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
        return { error: "Informe ao menos um assunto com as questões feitas." };
    }
    if (rawEntries.length > MAX_ENTRIES) {
        return { error: `Informe no máximo ${MAX_ENTRIES} assuntos por vez.` };
    }

    const merged = new Map();

    for (const item of rawEntries) {
        const total = Number(item?.total);
        const correct = Number(item?.correct);

        if (!isId(item?.topic_id)) return { error: "Selecione o assunto de todas as linhas." };
        if (!Number.isInteger(total) || total < 1 || total > MAX_QUESTIONS) {
            return { error: `O número de questões feitas deve ser de 1 a ${MAX_QUESTIONS}.` };
        }
        if (!Number.isInteger(correct) || correct < 0 || correct > total) {
            return { error: "O número de acertos deve ser de 0 até o total de questões feitas." };
        }

        // Mesmo assunto repetido na lista: soma as linhas.
        const key = String(item.topic_id);
        const prev = merged.get(key);
        merged.set(key, { topic_id: key, total: (prev?.total ?? 0) + total, correct: (prev?.correct ?? 0) + correct });
    }

    const topics = await Topic.find({ _id: { $in: [...merged.keys()] } }).select("subject_id").lean();
    if (topics.length !== merged.size) return { error: "Assunto não encontrado." };

    const subjectIds = [...new Set(topics.map((t) => String(t.subject_id)))];
    const subjects = await Subject.find({ _id: { $in: subjectIds }, user_id: userId }).select("active").lean();
    if (subjects.length !== subjectIds.length) return { error: "Assunto não encontrado." };
    if (subjects.some((s) => s.active === false)) {
        return { error: "Matéria desativada. Reative-a para registrar questões." };
    }

    const subjectByTopic = new Map(topics.map((t) => [String(t._id), String(t.subject_id)]));

    if (subjectId && [...subjectByTopic.values()].some((s) => s !== String(subjectId))) {
        return { error: "Os assuntos precisam ser da matéria da sessão." };
    }

    const entries = [...merged.values()].map((entry) => ({
        ...entry,
        subject_id: subjectByTopic.get(entry.topic_id),
    }));

    if (entries.some((e) => e.correct > e.total || e.total > MAX_QUESTIONS)) {
        return { error: `O número de questões por assunto deve ser de no máximo ${MAX_QUESTIONS}.` };
    }

    return { entries };
};

export const createQuestionLogs = async (req, res) => {
    try {
        const { entries: rawEntries } = req.body;

        const parsed = await parseQuestionEntries(rawEntries, req.userId);
        if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });

        const answeredAt = new Date();
        await QuestionLog.insertMany(parsed.entries.map((entry) => ({
            user_id: req.userId,
            subject_id: entry.subject_id,
            topic_id: entry.topic_id,
            total: entry.total,
            correct: entry.correct,
            answeredAt,
        })));

        res.status(201).json({ success: true, message: "Questões registradas com sucesso!" });
    } catch (error) {
        console.log("error in createQuestionLogs ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getQuestionStats = async (req, res) => {
    try {
        const subjects = await Subject.find({ user_id: req.userId, active: { $ne: false } })
            .select("title color")
            .sort({ createdAt: 1 })
            .lean();
        const subjectIds = subjects.map((s) => s._id);

        const [topics, byTopic, recent] = await Promise.all([
            Topic.find({ subject_id: { $in: subjectIds } }).select("title subject_id order").sort({ order: 1 }).lean(),
            QuestionLog.aggregate([
                { $match: { user_id: new mongoose.Types.ObjectId(req.userId), subject_id: { $in: subjectIds } } },
                {
                    $group: {
                        _id: "$topic_id",
                        subject_id: { $first: "$subject_id" },
                        total: { $sum: "$total" },
                        correct: { $sum: "$correct" },
                        sessions: { $sum: 1 },
                        lastAnsweredAt: { $max: "$answeredAt" },
                    },
                },
            ]),
            QuestionLog.find({ user_id: req.userId, subject_id: { $in: subjectIds } })
                .sort({ answeredAt: -1 })
                .limit(15)
                .lean(),
        ]);

        const topicStats = new Map(byTopic.map((row) => [String(row._id), row]));
        const topicTitles = new Map(topics.map((t) => [String(t._id), t.title]));

        const result = subjects.map((subject) => {
            const subjectId = String(subject._id);

            // Total da matéria soma TODOS os registros dela (inclusive de assuntos já apagados).
            const subjectRows = byTopic.filter((row) => String(row.subject_id) === subjectId);
            const total = subjectRows.reduce((sum, row) => sum + row.total, 0);
            const correct = subjectRows.reduce((sum, row) => sum + row.correct, 0);

            const subjectTopics = topics
                .filter((t) => String(t.subject_id) === subjectId)
                .map((t) => {
                    const stats = topicStats.get(String(t._id));
                    return {
                        id: String(t._id),
                        title: t.title,
                        total: stats?.total ?? 0,
                        correct: stats?.correct ?? 0,
                        wrong: (stats?.total ?? 0) - (stats?.correct ?? 0),
                        percent: percentOf(stats?.correct ?? 0, stats?.total ?? 0),
                        sessions: stats?.sessions ?? 0,
                        lastAnsweredAt: stats?.lastAnsweredAt ?? null,
                    };
                });

            return {
                id: subjectId,
                title: subject.title,
                color: subject.color,
                total,
                correct,
                wrong: total - correct,
                percent: percentOf(correct, total),
                topics: subjectTopics,
            };
        });

        const overallTotal = result.reduce((sum, s) => sum + s.total, 0);
        const overallCorrect = result.reduce((sum, s) => sum + s.correct, 0);
        const subjectMap = new Map(subjects.map((s) => [String(s._id), s]));

        res.status(200).json({
            success: true,
            overall: {
                total: overallTotal,
                correct: overallCorrect,
                wrong: overallTotal - overallCorrect,
                percent: percentOf(overallCorrect, overallTotal),
            },
            subjects: result,
            recent: recent.map((log) => ({
                id: String(log._id),
                subjectId: String(log.subject_id),
                subjectTitle: subjectMap.get(String(log.subject_id))?.title ?? "",
                subjectColor: subjectMap.get(String(log.subject_id))?.color ?? "#6b7280",
                topicId: String(log.topic_id),
                topicTitle: topicTitles.get(String(log.topic_id)) ?? "Assunto removido",
                total: log.total,
                correct: log.correct,
                percent: percentOf(log.correct, log.total),
                answeredAt: log.answeredAt,
            })),
        });
    } catch (error) {
        console.log("error in getQuestionStats ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteQuestionLog = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isId(id)) return res.status(400).json({ success: false, message: "Invalid id" });

        const log = await QuestionLog.findOneAndDelete({ _id: id, user_id: req.userId });
        if (!log) return res.status(404).json({ success: false, message: "Registro não encontrado." });

        res.status(200).json({ success: true, message: "Registro removido." });
    } catch (error) {
        console.log("error in deleteQuestionLog ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

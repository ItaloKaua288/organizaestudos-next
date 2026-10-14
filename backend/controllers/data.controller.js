import Subject from "../models/subject.model.js";
import Topic from "../models/topic.model.js";
import { subjectScope } from "../middleware/profile.js";

// Exportar/importar a ESTRUTURA do estudo (matérias > assuntos > subassuntos), por exemplo um edital.
// Não leva progresso: revisões, status, anexos, notas e questões ficam de fora. Tudo que é importado
// entra como PENDENTE, para o estudante começar o ciclo de revisões do zero.

const FORMAT_VERSION = 1;
const MAX_SUBJECTS = 60;
const MAX_TOPICS = 1500;
const MAX_TITLE = 200;
const HEX_COLOR = /^#([0-9A-F]{3}){1,2}$/i;
const DEFAULT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const CSV_HEADER = ["materia", "cor", "assunto", "subassunto"];
const BOM = "﻿";

const norm = (value) => String(value ?? "").trim().toLowerCase();

// ---------------------------------------------------------------- CSV

// Planilhas interpretam "=", "+", "-" e "@" no começo da célula como fórmula. Prefixa com apóstrofo ao exportar.
const csvCell = (value, delimiter) => {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replace(/"/g, '""')}"` : text;
};

const stripFormulaGuard = (text) => text.replace(/^'(?=[=+\-@])/, "");

const parseCsv = (raw) => {
    const text = raw.replace(/^﻿/, "");
    const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
    // Excel em português salva com ";". Detecta pelo cabeçalho.
    const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                cell += char;
            }
            continue;
        }

        if (char === '"') inQuotes = true;
        else if (char === delimiter) {
            row.push(cell);
            cell = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[i + 1] === "\n") i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        } else cell += char;
    }

    if (inQuotes) return { error: "O CSV tem aspas sem fechar." };
    if (cell !== "" || row.length) {
        row.push(cell);
        rows.push(row);
    }

    return { rows: rows.filter((r) => r.some((c) => c.trim() !== "")) };
};

const subjectsFromCsv = (raw) => {
    const parsed = parseCsv(raw);
    if (parsed.error) return parsed;

    const [header, ...body] = parsed.rows;
    if (!header) return { error: "O arquivo CSV está vazio." };

    const columns = header.map((name) => norm(name).normalize("NFD").replace(/[̀-ͯ]/g, ""));
    const index = Object.fromEntries(CSV_HEADER.map((name) => [name, columns.indexOf(name)]));

    if (index.materia === -1 || index.assunto === -1) {
        return { error: "O CSV precisa ter as colunas: materia, cor, assunto, subassunto." };
    }

    const subjects = new Map();

    for (const [lineNumber, cells] of body.map((cells, i) => [i + 2, cells])) {
        const read = (name) => (index[name] === -1 ? "" : stripFormulaGuard((cells[index[name]] ?? "").trim()));
        const subjectTitle = read("materia");
        const color = read("cor");
        const topicTitle = read("assunto");
        const subtopicTitle = read("subassunto");

        if (!subjectTitle) return { error: `Linha ${lineNumber}: informe a matéria.` };
        if (subtopicTitle && !topicTitle) return { error: `Linha ${lineNumber}: o subassunto precisa de um assunto.` };

        const key = norm(subjectTitle);
        if (!subjects.has(key)) subjects.set(key, { title: subjectTitle, color, topics: [] });
        const subject = subjects.get(key);
        if (!subject.color && color) subject.color = color;

        if (topicTitle) {
            let topic = subject.topics.find((t) => norm(t.title) === norm(topicTitle));
            if (!topic) {
                topic = { title: topicTitle, subtopics: [] };
                subject.topics.push(topic);
            }
            if (subtopicTitle) topic.subtopics.push(subtopicTitle);
        }
    }

    return { subjects: [...subjects.values()] };
};

// ---------------------------------------------------------------- JSON

const titleOf = (item) => (typeof item === "string" ? item : item?.title);

const subjectsFromJson = (raw) => {
    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return { error: "O arquivo JSON é inválido." };
    }

    if (!Array.isArray(data?.subjects)) return { error: 'O JSON precisa ter a lista "subjects".' };

    const subjects = data.subjects.map((subject) => ({
        title: String(subject?.title ?? "").trim(),
        color: String(subject?.color ?? "").trim(),
        topics: (Array.isArray(subject?.topics) ? subject.topics : []).map((topic) => ({
            title: String(titleOf(topic) ?? "").trim(),
            subtopics: (Array.isArray(topic?.subtopics) ? topic.subtopics : []).map((sub) => String(titleOf(sub) ?? "").trim()),
        })),
    }));

    return { subjects };
};

// ---------------------------------------------------------------- validação comum

const cleanStructure = (subjects) => {
    if (subjects.length === 0) return { error: "Nenhuma matéria encontrada no arquivo." };
    if (subjects.length > MAX_SUBJECTS) return { error: `Importe no máximo ${MAX_SUBJECTS} matérias por vez.` };

    let topicCount = 0;
    const seenSubjects = new Set();

    const cleaned = [];

    for (const subject of subjects) {
        if (!subject.title) return { error: "Há uma matéria sem título." };
        if (subject.title.length > MAX_TITLE) return { error: `Título de matéria acima de ${MAX_TITLE} caracteres: "${subject.title.slice(0, 30)}…"` };
        if (seenSubjects.has(norm(subject.title))) return { error: `A matéria "${subject.title}" aparece duas vezes.` };
        seenSubjects.add(norm(subject.title));

        if (subject.color && !HEX_COLOR.test(subject.color)) {
            return { error: `Cor inválida na matéria "${subject.title}". Use o formato #RRGGBB.` };
        }

        const seenTopics = new Set();
        const topics = [];

        for (const topic of subject.topics) {
            if (!topic.title) return { error: `Há um assunto sem título em "${subject.title}".` };
            if (topic.title.length > MAX_TITLE) return { error: `Título de assunto acima de ${MAX_TITLE} caracteres em "${subject.title}".` };
            if (seenTopics.has(norm(topic.title))) continue; // repetido no arquivo: ignora

            seenTopics.add(norm(topic.title));

            const seenSubtopics = new Set();
            const subtopics = [];

            for (const title of topic.subtopics) {
                if (!title) return { error: `Há um subassunto sem título em "${topic.title}".` };
                if (title.length > MAX_TITLE) return { error: `Título de subassunto acima de ${MAX_TITLE} caracteres em "${topic.title}".` };
                if (seenSubtopics.has(norm(title))) continue;
                seenSubtopics.add(norm(title));
                subtopics.push(title);
            }

            topicCount += 1 + subtopics.length;
            topics.push({ title: topic.title, subtopics });
        }

        cleaned.push({ title: subject.title, color: subject.color, topics });
    }

    if (topicCount > MAX_TOPICS) return { error: `Importe no máximo ${MAX_TOPICS} assuntos e subassuntos por vez.` };

    return { subjects: cleaned };
};

export const parseImportContent = (content) => {
    if (typeof content !== "string" || !content.trim()) return { error: "Envie o conteúdo do arquivo." };

    const text = content.replace(/^﻿/, "").trim();
    const parsed = text.startsWith("{") ? subjectsFromJson(text) : subjectsFromCsv(text);
    if (parsed.error) return parsed;

    return cleanStructure(parsed.subjects);
};

// ---------------------------------------------------------------- exportar

const loadStructure = async (req) => {
    const subjects = await Subject.find(subjectScope(req)).sort({ createdAt: 1 }).lean();
    const topics = await Topic.find({ subject_id: { $in: subjects.map((s) => s._id) } })
        .select("title status link subject_id parent_id order")
        .sort({ order: 1 })
        .lean();

    return subjects.map((subject) => {
        const own = topics.filter((t) => String(t.subject_id) === String(subject._id));
        const roots = own.filter((t) => !t.parent_id);

        return {
            title: subject.title,
            color: subject.color,
            active: subject.active !== false,
            topics: roots.map((root) => ({
                title: root.title,
                status: root.status,
                link: root.link ?? null,
                subtopics: own
                    .filter((t) => String(t.parent_id) === String(root._id))
                    .map((t) => ({ title: t.title, status: t.status, link: t.link ?? null })),
            })),
        };
    });
};

export const exportData = async (req, res) => {
    try {
        const format = req.query.format === "csv" ? "csv" : "json";
        const subjects = await loadStructure(req);
        const stamp = new Date().toISOString().slice(0, 10);

        if (format === "json") {
            const content = JSON.stringify({ app: "organizaestudos", version: FORMAT_VERSION, exportedAt: new Date().toISOString(), subjects }, null, 2);
            return res.status(200).json({ success: true, format, filename: `organizaestudos-${stamp}.json`, content });
        }

        const delimiter = ";";
        const lines = [CSV_HEADER.join(delimiter)];

        for (const subject of subjects) {
            const row = (topic = "", subtopic = "") =>
                [subject.title, subject.color, topic, subtopic].map((cell) => csvCell(cell, delimiter)).join(delimiter);

            if (subject.topics.length === 0) lines.push(row());

            for (const topic of subject.topics) {
                if (topic.subtopics.length === 0) lines.push(row(topic.title));
                else topic.subtopics.forEach((sub) => lines.push(row(topic.title, sub.title)));
            }
        }

        res.status(200).json({ success: true, format, filename: `organizaestudos-${stamp}.csv`, content: `${BOM}${lines.join("\r\n")}\r\n` });
    } catch (error) {
        console.log("error in exportData ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------------------------------------------------------- importar

export const importData = async (req, res) => {
    try {
        const parsed = parseImportContent(req.body?.content);
        if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });

        const existing = await Subject.find(subjectScope(req));
        const byTitle = new Map(existing.map((subject) => [norm(subject.title), subject]));

        const summary = { subjectsCreated: 0, subjectsMerged: 0, subjectsSkipped: 0, topicsCreated: 0, topicsSkipped: 0 };
        let colorIndex = existing.length;

        for (const incoming of parsed.subjects) {
            let subject = byTitle.get(norm(incoming.title));

            if (subject?.active === false) {
                // Mesma regra do createTopic: matéria desativada não recebe assuntos novos.
                summary.subjectsSkipped += 1;
                continue;
            }

            if (subject) {
                summary.subjectsMerged += 1;
            } else {
                subject = await Subject.create({
                    title: incoming.title,
                    user_id: req.userId,
                    profile_id: req.profileId,
                    color: incoming.color || DEFAULT_COLORS[colorIndex++ % DEFAULT_COLORS.length],
                });
                byTitle.set(norm(incoming.title), subject);
                summary.subjectsCreated += 1;
            }

            const currentTopics = await Topic.find({ subject_id: subject._id }).select("title parent_id order").lean();
            const currentRoots = currentTopics.filter((t) => !t.parent_id);
            const rootByTitle = new Map(currentRoots.map((t) => [norm(t.title), t]));
            let nextRootOrder = currentRoots.reduce((max, t) => Math.max(max, t.order ?? 0), -1) + 1;

            // Cria os assuntos principais que ainda não existem (ordem do arquivo).
            const newRoots = incoming.topics.filter((topic) => !rootByTitle.has(norm(topic.title)));
            summary.topicsSkipped += incoming.topics.length - newRoots.length;

            if (newRoots.length) {
                const created = await Topic.insertMany(
                    newRoots.map((topic) => ({ title: topic.title, subject_id: subject._id, parent_id: null, order: nextRootOrder++ })),
                    { ordered: true }
                );
                created.forEach((doc) => rootByTitle.set(norm(doc.title), doc));
                summary.topicsCreated += created.length;
            }

            // Subassuntos de cada assunto (novo ou já existente), sem repetir os que já existem.
            for (const topic of incoming.topics) {
                if (topic.subtopics.length === 0) continue;

                const parent = rootByTitle.get(norm(topic.title));
                const siblings = currentTopics.filter((t) => String(t.parent_id) === String(parent._id));
                const siblingTitles = new Set(siblings.map((t) => norm(t.title)));
                let nextOrder = siblings.reduce((max, t) => Math.max(max, t.order ?? 0), -1) + 1;

                const newSubtopics = topic.subtopics.filter((title) => !siblingTitles.has(norm(title)));
                summary.topicsSkipped += topic.subtopics.length - newSubtopics.length;
                if (newSubtopics.length === 0) continue;

                await Topic.insertMany(
                    newSubtopics.map((title) => ({ title, subject_id: subject._id, parent_id: parent._id, order: nextOrder++ })),
                    { ordered: true }
                );
                summary.topicsCreated += newSubtopics.length;

                // O pai vira só um organizador (igual ao createTopic): zera status e revisões.
                if (siblings.length === 0) {
                    await Topic.updateOne(
                        { _id: parent._id },
                        {
                            $set: {
                                status: "PENDENTE",
                                review1: null,
                                review2: null,
                                review3: null,
                                review1_concluded: false,
                                review2_concluded: false,
                                review3_concluded: false,
                                review3_interval: 30,
                                reviewLog: [],
                            },
                        }
                    );
                }
            }
        }

        res.status(200).json({ success: true, message: "Importação concluída.", summary });
    } catch (error) {
        console.log("error in importData ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

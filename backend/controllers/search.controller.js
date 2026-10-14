import Note from "../models/note.model.js";
import Subject from "../models/subject.model.js";
import Topic from "../models/topic.model.js";

const MIN_QUERY = 2;
const MAX_QUERY = 80;
const LIMIT = 8;
const SNIPPET_RADIUS = 60;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// As notas são guardadas como HTML (editor rico): tira as tags e normaliza espaços para o trecho de prévia.
const toPlainText = (html = "") =>
    html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();

const buildSnippet = (html, query) => {
    const text = toPlainText(html);
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.slice(0, SNIPPET_RADIUS * 2);

    const start = Math.max(0, index - SNIPPET_RADIUS);
    const end = Math.min(text.length, index + query.length + SNIPPET_RADIUS);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
};

/**
 * Busca global do usuário em matérias, assuntos e notas.
 * Só olha matérias ATIVAS do próprio usuário (matéria desativada some da busca, como no resto do app).
 */
export const globalSearch = async (req, res) => {
    try {
        const query = String(req.query.q ?? "").trim().slice(0, MAX_QUERY);

        if (query.length < MIN_QUERY) {
            return res.status(200).json({ success: true, query, subjects: [], topics: [], notes: [] });
        }

        const regex = new RegExp(escapeRegex(query), "i");

        const activeSubjects = await Subject.find({ user_id: req.userId, active: { $ne: false } })
            .select("title color")
            .lean();
        const subjectIds = activeSubjects.map((subject) => subject._id);
        const subjectMap = new Map(activeSubjects.map((subject) => [String(subject._id), subject]));

        const [topics, notes] = await Promise.all([
            Topic.find({ subject_id: { $in: subjectIds }, title: regex })
                .select("title subject_id parent_id status")
                .sort({ updatedAt: -1 })
                .limit(LIMIT)
                .lean(),
            Note.find({
                user_id: req.userId,
                subject_id: { $in: subjectIds },
                $or: [{ title: regex }, { content: regex }],
            })
                .select("title content subject_id")
                .sort({ updatedAt: -1 })
                .limit(LIMIT)
                .lean(),
        ]);

        const subjects = activeSubjects
            .filter((subject) => regex.test(subject.title))
            .slice(0, LIMIT)
            .map((subject) => ({ id: String(subject._id), title: subject.title, color: subject.color }));

        res.status(200).json({
            success: true,
            query,
            subjects,
            topics: topics.map((topic) => {
                const subject = subjectMap.get(String(topic.subject_id));
                return {
                    id: String(topic._id),
                    title: topic.title,
                    status: topic.status,
                    isSubtopic: Boolean(topic.parent_id),
                    subjectId: String(topic.subject_id),
                    subjectTitle: subject?.title ?? "",
                    subjectColor: subject?.color ?? "#6b7280",
                };
            }),
            notes: notes.map((note) => {
                const subject = subjectMap.get(String(note.subject_id));
                return {
                    id: String(note._id),
                    title: note.title,
                    snippet: buildSnippet(note.content, query),
                    subjectId: String(note.subject_id),
                    subjectTitle: subject?.title ?? "",
                    subjectColor: subject?.color ?? "#6b7280",
                };
            }),
        });
    } catch (error) {
        console.log("error in globalSearch ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

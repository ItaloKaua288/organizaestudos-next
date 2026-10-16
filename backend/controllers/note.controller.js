import https from "https";
import mongoose from "mongoose";
import Note, { MAX_NOTE_ATTACHMENTS, MAX_NOTE_TAGS, MAX_TAG_LENGTH } from "../models/note.model.js";
import Subject from "../models/subject.model.js";
import cloudinary from "../utils/cloudinary.js";

export const ALLOWED_ATTACHMENT_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
];

/** Minúsculas, sem "#", espaços viram "-", sem repetidas e dentro dos limites. */
function normalizeTags(input) {
    if (!Array.isArray(input)) return [];

    const seen = new Set();

    for (const raw of input) {
        if (typeof raw !== "string") continue;

        const tag = raw
            .trim()
            .replace(/^#+/, "")
            .toLowerCase()
            .replace(/\s+/g, "-")
            .slice(0, MAX_TAG_LENGTH);

        if (tag) seen.add(tag);
        if (seen.size >= MAX_NOTE_TAGS) break;
    }

    return [...seen];
}

/**
 * Lê os links para outras notas que o editor grava no HTML (<a data-note-id="...">)
 * e devolve só os ids que existem e pertencem ao usuário.
 */
async function extractLinkedNoteIds(content, userId, selfId) {
    if (typeof content !== "string") return [];

    const ids = new Set();
    for (const match of content.matchAll(/data-note-id="([0-9a-fA-F]{24})"/g)) {
        if (!selfId || match[1] !== String(selfId)) ids.add(match[1]);
    }

    if (ids.size === 0) return [];

    const found = await Note.find({ _id: { $in: [...ids] }, user_id: userId }).select("_id").lean();
    return found.map((note) => note._id);
}

const isInactive = (subject) => subject?.active === false;

export const createNote = async (req, res) => {
    const { title, content, subject_id, tags } = req.body;
    const user_id = req.userId;

    try {
        if (!title || !content || !subject_id) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const trimmedTitle = title.trim();

        if (!trimmedTitle) return res.status(400).json({ success: false, message: "Title cannot be empty" });

        const subject = await Subject.findOne({ _id: subject_id, user_id: req.userId });

        if (!subject)
            return res.status(404).json({ success: false, message: "Subject not found" });

        if (subject.active === false)
            return res.status(403).json({ success: false, message: "Matéria desativada. Reative-a para criar anotações." });

        const note = new Note({
            title: trimmedTitle,
            content,
            user_id,
            subject_id: subject._id,
            tags: normalizeTags(tags),
            links: await extractLinkedNoteIds(content, user_id)
        });

        await note.save();

        res.status(201).json({ success: true, message: "Note created successfully", note });
    } catch (error) {
        console.log("Erro no createNote: ", error);

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message)[0];
            return res.status(400).json({ success: false, message });
        }

        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getNotes = async (req, res) => {
    const user_id = req.userId;
    const { subjectId } = req.params;

    try {
        const notes = await Note.find({ user_id, subject_id: subjectId }).populate("subject_id").sort({ createdAt: -1 }).lean();

        // Backlinks: notas (de qualquer matéria) que mencionam alguma das notas desta lista.
        const noteIds = notes.map((note) => note._id);
        const mentioning = noteIds.length === 0 ? [] : await Note.find({ user_id, links: { $in: noteIds } })
            .select("title subject_id links")
            .lean();

        const backlinksByNote = new Map();
        for (const source of mentioning) {
            for (const target of source.links ?? []) {
                const key = String(target);
                const list = backlinksByNote.get(key) ?? [];
                list.push({ id: String(source._id), title: source.title, subjectId: String(source.subject_id) });
                backlinksByNote.set(key, list);
            }
        }

        const withBacklinks = notes.map((note) => ({
            ...note,
            backlinks: (backlinksByNote.get(String(note._id)) ?? []).filter((link) => link.id !== String(note._id)),
        }));

        res.status(200).json({ success: true, notes: withBacklinks });
    } catch (error) {
        console.log("error in getNotes ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

/** Lista enxuta de todas as notas do usuário, para escolher o destino de um link no editor. */
export const getLinkTargets = async (req, res) => {
    const user_id = req.userId;

    try {
        const notes = await Note.find({ user_id })
            .select("title subject_id")
            .populate("subject_id", "title color active")
            .sort({ updatedAt: -1 })
            .lean();

        const targets = notes
            .filter((note) => note.subject_id && note.subject_id.active !== false)
            .map((note) => ({
                id: String(note._id),
                title: note.title,
                subjectId: String(note.subject_id._id),
                subjectTitle: note.subject_id.title,
                subjectColor: note.subject_id.color,
            }));

        res.status(200).json({ success: true, targets });
    } catch (error) {
        console.log("error in getLinkTargets ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateNote = async (req, res) => {
    const { id } = req.params;
    let { title, content, subject_id, isPinned, tags } = req.body;
    const user_id = req.userId;

    try {
        if (title !== undefined) {
            title = title.trim();
            if (!title) return res.status(400).json({ success: false, message: "Title cannot be empty" });
        }

        if (subject_id) {
            const subject = await Subject.findOne({ _id: subject_id, user_id });
            if (!subject)
                return res.status(404).json({ success: false, message: "Subject not found" });

            if (subject.active === false)
                return res.status(403).json({ success: false, message: "Matéria desativada. Reative-a para editar anotações." });
        }

        // Só atualiza o que veio na requisição (fixar uma nota não pode apagar as tags, por exemplo).
        const update = {};
        if (title !== undefined) update.title = title;
        if (content !== undefined) {
            update.content = content;
            update.links = await extractLinkedNoteIds(content, user_id, id);
        }
        if (subject_id) update.subject_id = subject_id;
        if (isPinned !== undefined) update.isPinned = isPinned;
        if (tags !== undefined) update.tags = normalizeTags(tags);

        const note = await Note.findOneAndUpdate(
            { _id: id, user_id },
            update,
            { returnDocument: "after", runValidators: true }
        );

        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        res.status(200).json({ success: true, message: "Note updated successfully", note });
    } catch (error) {
        console.log("error in updateNote ", error);

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message)[0];
            return res.status(400).json({ success: false, message });
        }

        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const deleteNote = async (req, res) => {
    const { id } = req.params;
    const user_id = req.userId;

    try {
        const note = await Note.findOneAndDelete({ _id: id, user_id });

        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        if (note.attachments?.length) {
            await Promise.allSettled(note.attachments.map((file) => cloudinary.uploader.destroy(file.public_id)));
        }

        // Quem apontava para esta nota deixa de listá-la nos backlinks automaticamente,
        // mas o id some também de "links" para manter o banco limpo.
        await Note.updateMany({ user_id, links: note._id }, { $pull: { links: note._id } });

        res.status(200).json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        console.log("error in deleteNote ", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

/* ------------------------------------------------------------------ */
/* Anexos                                                              */
/* ------------------------------------------------------------------ */

const serializeAttachments = (note) =>
    (note.attachments ?? []).map((file) => ({
        id: String(file._id),
        name: file.name,
        url: file.url,
        public_id: file.public_id,
        mimeType: file.mimeType,
        size: file.size,
    }));

async function findOwnedNote(id, userId) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Note.findOne({ _id: id, user_id: userId });
}

export const uploadNoteAttachment = async (req, res) => {
    const { id } = req.params;

    try {
        const note = await findOwnedNote(id, req.userId);
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });

        const subject = await Subject.findById(note.subject_id).select("active").lean();
        if (isInactive(subject))
            return res.status(403).json({ success: false, message: "Matéria desativada. Reative-a para anexar arquivos." });

        if (!req.file) return res.status(400).json({ success: false, message: "Nenhum arquivo enviado." });

        if (!ALLOWED_ATTACHMENT_TYPES.includes(req.file.mimetype))
            return res.status(400).json({ success: false, message: "Envie um PDF ou uma imagem (PNG, JPG, WEBP ou GIF)." });

        if (note.attachments.length >= MAX_NOTE_ATTACHMENTS)
            return res.status(400).json({ success: false, message: `Limite de ${MAX_NOTE_ATTACHMENTS} anexos por nota atingido.` });

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto",
            folder: "notes_attachments"
        });

        // O multer entrega o nome em latin1; converte para UTF-8 para não quebrar acentos.
        const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");

        note.attachments.push({
            name: originalName,
            url: result.secure_url,
            public_id: result.public_id,
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        await note.save();

        res.status(200).json({ success: true, message: "Arquivo anexado com sucesso", attachments: serializeAttachments(note) });
    } catch (error) {
        console.log("error in uploadNoteAttachment ", error);
        res.status(500).json({ success: false, message: "Erro ao fazer upload do arquivo" });
    }
}

export const removeNoteAttachment = async (req, res) => {
    const { id } = req.params;
    const { public_id } = req.body;

    try {
        const note = await findOwnedNote(id, req.userId);
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });

        const attachment = note.attachments.find((file) => file.public_id === public_id);
        if (!attachment) return res.status(404).json({ success: false, message: "Attachment not found" });

        await cloudinary.uploader.destroy(attachment.public_id);

        note.attachments = note.attachments.filter((file) => file.public_id !== public_id);
        await note.save();

        res.status(200).json({ success: true, message: "Arquivo removido com sucesso", attachments: serializeAttachments(note) });
    } catch (error) {
        console.log("error in removeNoteAttachment ", error);
        res.status(500).json({ success: false, message: "Erro ao remover arquivo" });
    }
}

export const streamNoteAttachment = async (req, res) => {
    const { id, publicId } = req.params;

    try {
        const note = await findOwnedNote(id, req.userId);
        if (!note) return res.status(404).json({ success: false, message: "Note not found" });

        const decodedPublicId = decodeURIComponent(publicId);
        const attachment = note.attachments.find((file) => file.public_id === decodedPublicId);
        if (!attachment) return res.status(404).json({ success: false, message: "Arquivo não encontrado." });

        https.get(attachment.url, (stream) => {
            res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
            res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(attachment.name)}"`);
            stream.pipe(res);
        }).on("error", (e) => {
            console.log("Erro no stream do Cloudinary: ", e);
            res.status(500).json({ success: false, message: "Erro ao ler o arquivo na nuvem." });
        });
    } catch (error) {
        console.log("error in streamNoteAttachment ", error);
        res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
}

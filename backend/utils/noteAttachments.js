import Note from "../models/note.model.js";
import cloudinary from "./cloudinary.js";

/**
 * Apaga do Cloudinary os anexos das notas que combinam com o filtro e, em seguida,
 * apaga as próprias notas. Usado nas exclusões em cascata (matéria, perfil, usuário),
 * para não deixar arquivos órfãos na nuvem.
 */
export async function deleteNotesWithAttachments(filter) {
    const notes = await Note.find({ ...filter, "attachments.0": { $exists: true } })
        .select("attachments")
        .lean();

    const publicIds = notes.flatMap((note) => (note.attachments ?? []).map((file) => file.public_id));

    if (publicIds.length > 0) {
        // allSettled: falha em um arquivo não pode impedir a exclusão das notas.
        await Promise.allSettled(publicIds.filter(Boolean).map((id) => cloudinary.uploader.destroy(id)));
    }

    return Note.deleteMany(filter);
}

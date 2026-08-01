"use server"

import { createNote, deleteNote, updateNote } from "@/services/notes.service";

export async function addNoteAction(formData: FormData) {
    try {
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const subject_id = formData.get("subject_id") as string;
        await createNote(title, content, subject_id);

        return { success: true, message: "Anotação adicionada com sucesso!" }
    } catch (error) {
        console.error("Erro ao adicionar anotação:", error);
        return { success: false, message: "Erro ao adicionar anotação." }
    }
}

export async function deleteNoteAction(formData: FormData) {
    try {
        const noteId = formData.get("noteId") as string;
        const subject_id = formData.get("subject_id") as string;
        await deleteNote(noteId, subject_id);
        return { success: true, message: "Anotação deletada com sucesso!" }
    } catch (error) {
        console.error("Erro ao deletar anotação:", error);
        return { success: false, message: "Erro ao deletar anotação." }
    }
}

export async function pinNoteAction(formData: FormData) {
    try {
        const noteId = formData.get("noteId") as string;
        const subject_id = formData.get("subject_id") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const isPinned = formData.get("isPinned") === "true";
        await updateNote(noteId, title, content, subject_id, isPinned);
        return { success: true, message: "Anotação fixada com sucesso!" }
    } catch (error) {
        console.error("Erro ao fixar anotação:", error);
        return { success: false, message: "Erro ao fixar anotação." }
    }
}

export async function updateNoteAction(formData: FormData) {
    try {
        const noteId = formData.get("noteId") as string;
        const subject_id = formData.get("subject_id") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const isPinned = formData.get("isPinned") === "true";
        await updateNote(noteId, title, content, subject_id, isPinned);
        return { success: true, message: "Anotação atualizada com sucesso!" }
    } catch (error) {
        console.error("Erro ao atualizar anotação:", error);
        return { success: false, message: "Erro ao atualizar anotação." }
    }
}
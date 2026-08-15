"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { NoteApiResponse } from "@/types/apiResponse";
import { Note } from "@/types/note";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getNotes(subjectId: string): Promise<Note[]> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${subjectId}`, {
            headers,
            cache: "force-cache",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha ao buscar as anotações na API.");
        }

        const data: NoteApiResponse = await res.json();

        return data.notes.map((item) => ({
            id: item._id,
            title: item.title,
            content: item.content,
            is_pined: item.isPinned,
            subject: {
                id: item.subject_id._id,
                title: item.subject_id.title,
                color: item.subject_id.color
            },
        }));

    } catch (error) {
        console.error("Erro interno ao buscar as anotações:", error);
        throw new Error("Não foi possível carregar as anotações. Tente novamente mais tarde.");
    }
}

const noteSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    content: z.string().min(1, "O conteúdo é obrigatório"),
    subject_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido"),
});

export async function addNoteAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = noteSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { title, content, subject_id } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, content, subject_id })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return {
                success: false,
                message: errorData.message || "Falha da API ao criar anotação."
            };
        }

        revalidatePath(`/materias/${subject_id}`);
        revalidatePath(`/notas/${subject_id}`);

        return { success: true, message: "Anotação adicionada com sucesso!" }
    } catch (error) {
        console.error("Erro interno ao adicionar anotação:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const deleteNoteSchema = z.object({
    noteId: z.string().min(1, "O ID da anotação é obrigatório."),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório.")
});

export async function deleteNoteAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteNoteSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação ao deletar:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos para deleção." };
        }

        const { noteId, subject_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao deletar anotação." };
        }

        revalidatePath(`/materias/${subject_id}`);
        revalidatePath(`/notas/${subject_id}`);

        return { success: true, message: "Anotação deletada com sucesso!" }
    } catch (error) {
        console.error("Erro interno ao deletar anotação:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const updateNoteSchema = z.object({
    noteId: z.string().min(1, "O ID da anotação é obrigatório."),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório."),
    title: z.string().min(1, "O título é obrigatório."),
    content: z.string().min(1, "O conteúdo é obrigatório."),
    isPinned: z.union([z.boolean(), z.literal("true"), z.literal("false")])
        .transform((val) => val === true || val === "true")
});

export async function updateNoteAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = updateNoteSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação ao atualizar:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos no formulário de atualização." };
        }

        const { noteId, subject_id, title, content, isPinned } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, content, subject_id, isPinned })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao atualizar anotação." };
        }

        revalidatePath(`/materias/${subject_id}`);
        revalidatePath(`/notas/${subject_id}`);

        return { success: true, message: "Anotação atualizada com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao atualizar anotação:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

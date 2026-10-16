"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { NoteApiResponse } from "@/types/apiResponse";
import { Note, NoteAttachment, NoteLinkTarget } from "@/types/note";
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
            tags: item.tags ?? [],
            attachments: (item.attachments ?? []).map((file) => ({
                id: file._id,
                name: file.name,
                url: file.url,
                public_id: file.public_id,
                mimeType: file.mimeType ?? "application/pdf",
                size: file.size ?? 0,
            })),
            backlinks: item.backlinks ?? [],
            created_at: item.createdAt,
            updated_at: item.updatedAt,
        }));

    } catch (error) {
        console.error("Erro interno ao buscar as anotações:", error);
        throw new Error("Não foi possível carregar as anotações. Tente novamente mais tarde.");
    }
}

/** As tags viajam no FormData como um JSON (["prova", "revisar"]). Valor ausente = não mexer nas tags. */
const tagsField = z
    .string()
    .optional()
    .transform((value, ctx) => {
        if (value === undefined) return undefined;
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.every((tag) => typeof tag === "string")) return parsed as string[];
        } catch {
            // cai no erro abaixo
        }
        ctx.addIssue({ code: "custom", message: "Tags inválidas" });
        return z.NEVER;
    });

const noteSchema = z.object({
    title: z.string().min(1, "O título é obrigatório"),
    content: z.string().min(1, "O conteúdo é obrigatório"),
    subject_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID inválido"),
    tags: tagsField,
});

export async function addNoteAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = noteSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { title, content, subject_id, tags } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, content, subject_id, tags })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return {
                success: false,
                message: errorData.message || "Falha da API ao criar anotação."
            };
        }

        const created = await res.json().catch(() => ({}));

        revalidatePath(`/materias/${subject_id}`);
        revalidatePath(`/notas/${subject_id}`);

        return {
            success: true,
            message: "Anotação adicionada com sucesso!",
            // O diálogo usa o id para enviar os anexos escolhidos antes de a nota existir.
            noteId: (created.note?._id as string | undefined) ?? null
        }
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
    tags: tagsField,
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

        const { noteId, subject_id, title, content, isPinned, tags } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, content, subject_id, isPinned, tags })
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

const ALLOWED_ATTACHMENT_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
];

const uploadNoteAttachmentSchema = z.object({
    noteId: z.string().min(1, "O ID da anotação é obrigatório."),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório."),
    file: z
        .file()
        .refine((file) => file.size <= 5242880, "O arquivo deve ter no máximo 5 MB!")
        .refine((file) => ALLOWED_ATTACHMENT_TYPES.includes(file.type), "Envie um PDF ou uma imagem (PNG, JPG, WEBP ou GIF)."),
});

type AttachmentsResult = { success: boolean; message: string; attachments?: NoteAttachment[] };

function mapAttachments(raw: unknown): NoteAttachment[] {
    if (!Array.isArray(raw)) return [];

    return raw.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url,
        public_id: file.public_id,
        mimeType: file.mimeType ?? "application/pdf",
        size: file.size ?? 0,
    }));
}

export async function uploadNoteAttachmentAction(formData: FormData): Promise<AttachmentsResult> {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = uploadNoteAttachmentSchema.safeParse(rawData);

        if (!validatedData.success) {
            const [issue] = validatedData.error.issues;
            return { success: false, message: issue?.message || "Arquivo inválido." };
        }

        const { noteId, subject_id, file } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        // O fetch define o Content-Type (multipart) sozinho.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { "Content-Type": _, ...headersUpload } = headers;

        const body = new FormData();
        body.append("file", file);

        const res = await fetch(`${baseUrl}/notes/${noteId}/attachments`, {
            method: "POST",
            headers: headersUpload,
            body
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao enviar o anexo." };
        }

        const data = await res.json();

        revalidatePath(`/materias/${subject_id}`);
        revalidatePath(`/notas/${subject_id}`);

        return { success: true, message: "Anexo enviado!", attachments: mapAttachments(data.attachments) };
    } catch (error) {
        console.error("Erro interno ao enviar anexo da nota:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const deleteNoteAttachmentSchema = z.object({
    noteId: z.string().min(1, "O ID da anotação é obrigatório."),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório."),
    public_id: z.string().min(1, "O public_id do anexo é obrigatório."),
});

export async function deleteNoteAttachmentAction(formData: FormData): Promise<AttachmentsResult> {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteNoteAttachmentSchema.safeParse(rawData);

        if (!validatedData.success) {
            return { success: false, message: "Dados inválidos para remover o anexo." };
        }

        const { noteId, subject_id, public_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}/attachments`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ public_id })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao remover o anexo." };
        }

        const data = await res.json();

        revalidatePath(`/materias/${subject_id}`);
        revalidatePath(`/notas/${subject_id}`);

        return { success: true, message: "Anexo removido!", attachments: mapAttachments(data.attachments) };
    } catch (error) {
        console.error("Erro interno ao remover anexo da nota:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const openNoteAttachmentSchema = z.object({
    noteId: z.string().min(1, "O ID da anotação é obrigatório."),
    public_id: z.string().min(1, "O public_id do anexo é obrigatório."),
});

export async function openNoteAttachmentAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = openNoteAttachmentSchema.safeParse(rawData);

        if (!validatedData.success) {
            return { success: false, message: "Dados inválidos.", blob: null };
        }

        const { noteId, public_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}/attachments/${encodeURIComponent(public_id)}`, {
            headers,
            cache: "no-store",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao abrir o anexo.", blob: null };
        }

        return { success: true, message: "", blob: await res.blob() };
    } catch (error) {
        console.error("Erro interno ao abrir anexo da nota:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", blob: null };
    }
}

/** Todas as notas do usuário (só o essencial), para escolher o destino de um link no editor. */
export async function getNoteLinkTargetsAction(): Promise<NoteLinkTarget[]> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/link-targets`, {
            headers,
            cache: "no-store",
        });

        if (!res.ok) return [];

        const data = await res.json();
        return (data.targets ?? []) as NoteLinkTarget[];
    } catch (error) {
        console.error("Erro interno ao buscar notas para link:", error);
        return [];
    }
}

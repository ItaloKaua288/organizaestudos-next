"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { fixEncoding } from "@/lib/text";
import { ApiDetailSubjectResponse, ApiSubjectResponse } from "@/types/apiResponse";
import { Note } from "@/types/note";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function getSubjectsAction(): Promise<Subject[]> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects`, {
            headers,
            cache: "force-cache",
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha ao buscar as matérias na API.");
        }

        const data: ApiSubjectResponse = await res.json();

        return data.subjects.map((item) => ({
            id: item._id,
            title: item.title,
            color: item.color,
        }))
    } catch (error) {
        console.error("Erro interno ao buscar as matérias:", error);
        throw new Error("Não foi possível carregar as matérias. Tente novamente mais tarde.");
    }
}

export async function getDetailSubjectAction(subject_id: string) {
    try {
        if (!subject_id) throw new Error("ID da matéria não fornecido.");

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects/${subject_id}`, {
            headers,
            cache: "force-cache",
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha da API ao buscar detalhes da matéria.");
        }

        const data: ApiDetailSubjectResponse = await res.json()

        const subjectInfo = {
            id: data.subject._id,
            title: data.subject.title,
            color: data.subject.color,
        };

        return {
            ...subjectInfo,

            topics: data.topics.map((topic): Topic => ({
                id: topic._id,
                title: topic.title,
                status: topic.status,
                order: topic.order,

                subject: subjectInfo,

                reviews: {
                    first: {
                        date: topic.review1,
                        concluded: topic.review1_concluded,
                    },
                    second: {
                        date: topic.review2,
                        concluded: topic.review2_concluded,
                    },
                    third: {
                        date: topic.review3,
                        concluded: topic.review3_concluded,
                    },
                },

                link: topic.link,
                attachments: topic.attachments.map((attach) => ({
                    id: attach._id!,
                    name: fixEncoding(attach.name),
                    url: attach.url,
                    file: attach.file,
                    public_id: attach.public_id,
                })),
            })),

            notes: data.notes.map((note): Note => ({
                id: note._id,
                title: note.title,
                content: note.content,
                is_pined: note.isPinned,
                subject: subjectInfo,
            })),
            timelines: data.timelines.map((timeline) => ({
                id: timeline._id,
                day: timeline.day,
                start_time: timeline.startTime,
                end_time: timeline.endTime,
                subject: subjectInfo,
            }))
        };
    } catch (error) {
        console.error("Erro interno ao buscar detalhes da matéria:", error);
        throw new Error("Não foi possível carregar detalhes da matéria. Tente novamente mais tarde.");
    }
}

const createSubjectSchema = z.object({
    title: z.string().min(1, "O título é obrigatório."),
    color: z.string().min(1, "A cor é obrigatória."),
});

export async function createSubjectAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = createSubjectSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário.", };
        }

        const { title, color } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, color, }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao criar matéria.", };
        }

        revalidatePath("/materias");

        return { success: true, message: "Matéria criada com sucesso!", };
    } catch (error) {
        console.error("Erro interno ao criar matéria:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", };
    }
}

const updateSubjectSchema = z.object({
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!"),
    title: z.string().min(1, "O título é obrigatório."),
    color: z.string().min(1, "A cor é obrigatória."),
});

export async function updateSubjectAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = updateSubjectSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));

            return { success: false, message: "Dados inválidos enviados no formulário.", };
        }

        const { subject_id, title, color, } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects/${subject_id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, color, }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));

            return { success: false, message: errorData.message || "Falha da API ao atualizar matéria.", };
        }

        revalidatePath("/materias");
        revalidatePath("/notas");
        revalidatePath("/");
        revalidatePath("/cronograma");
        revalidatePath("/revisoes");

        return { success: true, message: "Matéria atualizada com sucesso!", };
    } catch (error) {
        console.error("Erro interno ao atualizar matéria:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", };
    }
}

const deleteSubjectSchema = z.object({
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!"),
});

export async function deleteSubjectAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteSubjectSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário.", };
        }

        const { subject_id } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects/${subject_id}`, {
            method: "DELETE",
            headers,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao deletar matéria.", };
        }

        revalidatePath("/materias");

        return { success: true, message: "Matéria deletada com sucesso!", };
    } catch (error) {
        console.error("Erro interno ao deletar matéria:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", };
    }
}
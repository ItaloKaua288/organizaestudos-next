"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { TimelineApiResponse } from "@/types/apiResponse";
import { Timeline } from "@/types/timeline";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function getTimelinesAction(): Promise<Timeline[]> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines`, {
            headers,
            cache: "force-cache",
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha ao buscar a timeline na API.");
        }

        const data: TimelineApiResponse = await res.json()
        
        return data.timeline.map((item) => ({
            id: item._id,
            day: item.day,
            start_time: item.startTime,
            end_time: item.endTime,
            subject: {
                id: item.subject_id._id,
                title: item.subject_id.title,
                color: item.subject_id.color,
            },
        }))
    } catch (error) {
        console.error("Erro interno ao buscar a timeline:", error);
        throw new Error("Não foi possível carregar a timeline. Tente novamente mais tarde.");
    }
}

const createTimelineSchema = z.object({
    day: z.string().min(1, "Dia da semana é obrigatório!"),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!"),
    startTime: z.string().min(1, "O horário de ínicio é obrigatório!"),
    endTime: z.string().min(1, "O horário de termino é obrigatório!"),
})

export async function createTimelineAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = createTimelineSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário.", };
        }

        const { day, subject_id, startTime, endTime } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines`, {
            headers,
            method: "POST",
            body: JSON.stringify({ day, subject_id, startTime, endTime })
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao criar timeline.", };
        }

        revalidatePath("/cronograma");

        return { success: true, message: "Timeline criada com sucesso!", };
    } catch (error) {
        console.error("Erro interno ao criar timeline:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", };
    }
}

const deleteTimelineSchema = z.object({
    timeline_id: z.string().min(1, "O ID da timeline é obrigatório!"),
})

export async function deleteTimelineAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteTimelineSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário.", };
        }

        const { timeline_id } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines/${timeline_id}`, {
            method: "DELETE",
            headers
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao deletar timeline.", };
        }

        revalidatePath("/cronograma")

        return { success: true, message: "Timeline deletada com sucesso!", };
    } catch (error) {
        console.error("Erro interno ao deletar timeline:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", };
    }
}

const updateTimelineSchema = z.object({
    day: z.string().min(1, "Dia da semana é obrigatório!"),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!"),
    startTime: z.string().min(1, "O horário de ínicio é obrigatório!"),
    endTime: z.string().min(1, "O horário de termino é obrigatório!"),
    timeline_id: z.string().min(1, "O ID da timeline é obrigatório!"),
})

export async function updateTimelineAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = updateTimelineSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));

            return { success: false, message: "Dados inválidos enviados no formulário.", };
        }

        const { subject_id, day, endTime, startTime, timeline_id } = validatedData.data;

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines/${timeline_id}`, {
            headers,
            method: "PUT",
            body: JSON.stringify({ day, subject_id, startTime, endTime })
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao atualizar a timeline.", };
        }

        revalidatePath("/cronograma")

        return { success: true, message: "Timeline atualizada com sucesso!", };
    } catch (error) {
        console.error("Erro interno ao atualizar timeline:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", };
    }
}
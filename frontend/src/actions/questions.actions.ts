"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { QuestionEntryInput, QuestionStats } from "@/types/question";
import { revalidatePath } from "next/cache";

export async function getQuestionStatsAction(): Promise<QuestionStats> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/questions/stats`, {
            headers,
            cache: "no-store", // o desempenho muda a cada sessão registrada
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha ao buscar o desempenho na API.");
        }

        const data = await res.json();

        return {
            overall: data.overall,
            subjects: data.subjects,
            recent: data.recent,
        };
    } catch (error) {
        console.error("Erro interno ao buscar o desempenho:", error);
        throw new Error("Não foi possível carregar o desempenho. Tente novamente mais tarde.");
    }
}

/** Registra questões fora de uma sessão do ciclo (ex.: pela página de desempenho). */
export async function createQuestionLogsAction(entries: QuestionEntryInput[]) {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/questions`, {
            method: "POST",
            headers,
            body: JSON.stringify({ entries }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao registrar as questões." };
        }

        revalidatePath("/desempenho");

        return { success: true, message: "Questões registradas com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao registrar questões:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function deleteQuestionLogAction(id: string) {
    try {
        if (!id) return { success: false, message: "Registro inválido." };

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/questions/${id}`, {
            method: "DELETE",
            headers,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao remover o registro." };
        }

        revalidatePath("/desempenho");

        return { success: true, message: "Registro removido." };
    } catch (error) {
        console.error("Erro interno ao remover registro de questões:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

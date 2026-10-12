"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { revalidatePath } from "next/cache";
import { updateTopicReviewStatusAction } from "./topics.actions";

export type ReviewPerformance = "ERROU" | "DIFICIL" | "BOM" | "FACIL";

export async function changeReviewStatus(topicId: string, review: string, isCompleted: boolean, performance?: ReviewPerformance) {
    try {
        const formData = new FormData()
        formData.append("topicId", topicId)
        formData.append("review", review)
        formData.append("isCompleted", `${isCompleted}`)
        if (performance) formData.append("performance", performance)
        const result = await updateTopicReviewStatusAction(formData);

        if (!result.success) {
            return { success: false, error: result.message };
        }

        return { success: true, nextReview: result.nextReview };
    } catch (error) {
        console.error("Error completing review:", error);

        return {
            success: false,
            error: "Failed to update the review.",
        };
    }
}

export async function redistributeMonthlyReviewsAction() {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/redistribute-reviews`, {
            method: "PUT",
            headers,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao organizar revisões.", updated: 0 };
        }

        const data = await res.json();

        revalidatePath("/");
        revalidatePath("/revisoes");
        revalidatePath("/cronograma");
        revalidatePath("/materias");

        return { success: true, message: data.message as string, updated: (data.updated ?? 0) as number };
    } catch (error) {
        console.error("Erro ao organizar revisões de 30 dias:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", updated: 0 };
    }
}

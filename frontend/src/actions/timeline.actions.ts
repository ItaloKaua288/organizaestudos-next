"use server"

import { createTimeline, deleteTimeline } from "@/services/timeline.service"

export async function addTimelineAction(formData: FormData) {
    try {
        const day = formData.get("day") as string;
        const subject = formData.get("subject") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;

        await createTimeline({ day, subject_id: subject, startTime: startTime, endTime: endTime });

        return { success: true, message: "Cronograma adicionado com sucesso!" }
    } catch (error) {
        console.error("Erro ao adicionar cronograma:", error);
        return { success: false, message: "Erro ao adicionar cronograma." }
    }
}

export async function deleteTimelineAction(timelineId: string) {
    try {
        await deleteTimeline(timelineId);

        return { success: true, message: "Cronograma excluído com sucesso!" }
    } catch (error) {
        console.error("Erro ao excluir cronograma:", error);
        return { success: false, message: "Erro ao excluir cronograma." }
    }
}
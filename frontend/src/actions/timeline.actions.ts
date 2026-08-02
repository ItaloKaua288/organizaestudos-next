"use server"

import { createTimeline, deleteTimeline, updateTimeline } from "@/services/timeline.service";

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

export async function updateTimelineAction(formData: FormData) {
    try {
        const subject_id = formData.get("subject_id") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;
        const day = formData.get("day") as string;
        const timeline_id = formData.get("timeline_id") as string;


        await updateTimeline({ timeline_id, subject_id, startTime, endTime, day });

        return {
            success: true,
            message: "Timeline atualizada com sucesso!",
        };
    } catch (error) {
        console.error("Erro ao atualizar timeline:", error);

        return {
            success: false,
            message: "Erro ao atualizar timeline.",
        };
    }
}
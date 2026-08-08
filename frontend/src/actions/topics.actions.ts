import { createTopic, deleteAttachPDF } from "@/services/topics.service";

export async function deleteAttachAction(formData: FormData) {
    try {
        const topicId = formData.get("topicId") as string;
        const public_id = formData.get("public_id") as string;

        if (!topicId) throw new Error("Id do assunto não informado");

        await deleteAttachPDF(topicId, public_id);
        return { success: true, message: "Anexo deletado com sucesso!" }
    } catch (error) {
        console.error("Erro ao deletar anexo:", error);
        return { success: false, message: "Erro ao deletar anexo." }
    }
}

export async function createTopicAction(formData: FormData, subject_id: string) {
    try {
        const title = formData.get("title") as string;

        if (!title) throw new Error("Título não fornecido!");

        await createTopic(title, subject_id);
        return { success: true, message: "Assunto criado!" }
    } catch (error) {
        console.error("Erro ao criar assunto:", error);
        return { success: false, message: "Erro ao criar assunto." }
    }
}
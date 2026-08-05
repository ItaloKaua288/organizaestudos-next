import { deleteAttachPDF } from "@/services/topics.service";

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
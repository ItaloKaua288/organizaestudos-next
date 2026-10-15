import { openTopicAttachmentAction } from "@/actions/topics.actions";
import toast from "react-hot-toast";

/**
 * Baixa um anexo (PDF) de um assunto para o dispositivo da pessoa.
 * Usa a mesma action que abre o anexo, mas salva o arquivo em vez de abrir uma aba.
 */
export async function downloadTopicAttachment(
    topicId: string,
    publicId: string,
    fileName: string
) {
    const toastId = `download-attachment-${publicId}`;

    try {
        toast.loading("Baixando anexo...", { id: toastId });

        const formData = new FormData();
        formData.append("topicId", topicId);
        formData.append("public_id", publicId);

        const { blob } = await openTopicAttachmentAction(formData);

        if (!blob) {
            toast.error("Falha ao baixar o anexo", { id: toastId });
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = /\.pdf$/i.test(fileName) ? fileName : `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.success("Anexo baixado!", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Falha ao baixar o anexo", { id: toastId });
    }
}

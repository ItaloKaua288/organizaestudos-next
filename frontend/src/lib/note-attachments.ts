import { openNoteAttachmentAction } from "@/actions/notes.actions";
import type { NoteAttachment } from "@/types/note";
import toast from "react-hot-toast";

export const MAX_NOTE_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB, igual ao backend
export const ATTACHMENT_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp,image/gif";

const ALLOWED_TYPES = ATTACHMENT_ACCEPT.split(",");

/** Devolve a mensagem de erro, ou null quando o arquivo pode ser anexado. */
export function validateAttachment(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return `"${file.name}" não é aceito. Envie PDF, PNG, JPG, WEBP ou GIF.`;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
        return `"${file.name}" passa de 5 MB.`;
    }
    return null;
}

export function formatFileSize(bytes: number): string {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export const isImageAttachment = (mimeType: string | undefined) => Boolean(mimeType?.startsWith("image/"));

async function fetchAttachmentBlob(noteId: string, attachment: NoteAttachment) {
    const formData = new FormData();
    formData.append("noteId", noteId);
    formData.append("public_id", attachment.public_id);

    return (await openNoteAttachmentAction(formData)).blob;
}

/** Abre o anexo em uma nova aba. */
export async function openNoteAttachment(noteId: string, attachment: NoteAttachment) {
    const toastId = `open-note-attachment-${attachment.public_id}`;

    try {
        toast.loading("Abrindo anexo...", { id: toastId });
        const blob = await fetchAttachmentBlob(noteId, attachment);

        if (!blob) {
            toast.error("Não foi possível abrir o anexo.", { id: toastId });
            return;
        }

        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.dismiss(toastId);
    } catch (error) {
        console.error(error);
        toast.error("Não foi possível abrir o anexo.", { id: toastId });
    }
}

/** Baixa o anexo para o dispositivo. */
export async function downloadNoteAttachment(noteId: string, attachment: NoteAttachment) {
    const toastId = `download-note-attachment-${attachment.public_id}`;

    try {
        toast.loading("Baixando anexo...", { id: toastId });
        const blob = await fetchAttachmentBlob(noteId, attachment);

        if (!blob) {
            toast.error("Não foi possível baixar o anexo.", { id: toastId });
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        toast.success("Anexo baixado!", { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error("Não foi possível baixar o anexo.", { id: toastId });
    }
}

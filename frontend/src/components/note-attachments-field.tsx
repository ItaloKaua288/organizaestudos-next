"use client";

import { Button } from "@/components/ui/button";
import {
    ATTACHMENT_ACCEPT,
    MAX_NOTE_ATTACHMENTS,
    formatFileSize,
    isImageAttachment,
    openNoteAttachment,
    validateAttachment,
} from "@/lib/note-attachments";
import type { NoteAttachment } from "@/types/note";
import { FileText, Paperclip, X } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";

interface NoteAttachmentsFieldProps {
    /** Anexos que já estão salvos na nota. */
    existing: NoteAttachment[];
    /** Arquivos escolhidos que ainda serão enviados (usado ao criar a nota). */
    pending?: File[];
    /** Id da nota, necessário para abrir os anexos salvos. */
    noteId?: string;
    busy?: boolean;
    onPick: (files: File[]) => void;
    onRemovePending?: (index: number) => void;
    onRemoveExisting: (attachment: NoteAttachment) => void;
}

export function NoteAttachmentsField({
    existing,
    pending = [],
    noteId,
    busy = false,
    onPick,
    onRemovePending,
    onRemoveExisting,
}: NoteAttachmentsFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const total = existing.length + pending.length;
    const remainingSlots = MAX_NOTE_ATTACHMENTS - total;

    const handleFiles = (list: FileList | null) => {
        const files = Array.from(list ?? []);
        if (inputRef.current) inputRef.current.value = "";
        if (files.length === 0) return;

        const accepted: File[] = [];

        for (const file of files) {
            const problem = validateAttachment(file);
            if (problem) {
                toast.error(problem);
            } else if (accepted.length < remainingSlots) {
                accepted.push(file);
            } else {
                toast.error(`Cada nota aceita até ${MAX_NOTE_ATTACHMENTS} anexos.`, { id: "attachment-limit" });
                break;
            }
        }

        if (accepted.length > 0) onPick(accepted);
    };

    return (
        <div className="space-y-2">
            {total > 0 ? (
                <ul className="space-y-1.5">
                    {existing.map((attachment) => (
                        <li key={attachment.public_id} className="flex items-center gap-2 rounded-lg border border-input px-2 py-1.5">
                            <button
                                type="button"
                                disabled={!noteId}
                                onClick={() => noteId && openNoteAttachment(noteId, attachment)}
                                className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm focus-visible:outline-none enabled:hover:text-primary"
                                title="Abrir anexo"
                            >
                                <AttachmentThumb attachment={attachment} />
                                <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                            </button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={busy}
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => onRemoveExisting(attachment)}
                                aria-label={`Remover ${attachment.name}`}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </li>
                    ))}

                    {pending.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-dashed border-input px-2 py-1.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-foreground/6">
                                <FileText className="size-4 text-muted-foreground" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">envia ao salvar</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => onRemovePending?.(index)}
                                aria-label={`Tirar ${file.name} da lista`}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : null}

            <input
                ref={inputRef}
                type="file"
                accept={ATTACHMENT_ACCEPT}
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => handleFiles(event.target.files)}
            />

            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || remainingSlots <= 0}
                onClick={() => inputRef.current?.click()}
            >
                <Paperclip className="size-3.5" />
                {busy ? "Enviando..." : "Anexar arquivo"}
            </Button>

            <p className="text-xs text-muted-foreground">
                PDF ou imagem, até 5 MB cada. {total}/{MAX_NOTE_ATTACHMENTS} anexos.
            </p>
        </div>
    );
}

export function AttachmentThumb({ attachment }: { attachment: NoteAttachment }) {
    if (isImageAttachment(attachment.mimeType)) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={attachment.url}
                alt=""
                className="size-8 shrink-0 rounded-md object-cover"
                loading="lazy"
            />
        );
    }

    return (
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-foreground/6">
            <FileText className="size-4 text-muted-foreground" />
        </span>
    );
}

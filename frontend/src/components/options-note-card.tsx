"use client"

import {
    deleteNoteAction,
    deleteNoteAttachmentAction,
    updateNoteAction,
    uploadNoteAttachmentAction
} from "@/actions/notes.actions";
import { DialogDemo } from "@/components/dialog-button";
import { NoteAttachmentsField } from "@/components/note-attachments-field";
import dynamic from "next/dynamic";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { exportNoteAsMarkdown, exportNoteAsPdf } from "@/lib/note-export";
import { Note, NoteAttachment } from "@/types/note";
import DOMPurify from "isomorphic-dompurify";
import { FileDown, FileText, PencilLine, Pin, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

// O editor (Tiptap) é pesado: só é baixado quando a tela de edição realmente abre.
const RichTextEditor = dynamic(
    () => import("@/components/rich-text-editor").then((m) => m.RichTextEditor),
    { ssr: false, loading: () => <div className="min-h-40 animate-pulse rounded-xl bg-foreground/5" /> }
);

interface OptionsNoteCardProps {
    subjectId: string;
    note: Note;
    /** Tags já usadas na matéria, sugeridas ao editar. */
    tagSuggestions?: string[];
}

export function OptionsNoteCard({ subjectId, note, tagSuggestions }: OptionsNoteCardProps) {
    const [isOpenDialog, setIsOpenDialog] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [content, setContent] = useState(note.content)
    const [title, setTitle] = useState(note.title)
    const [tags, setTags] = useState<string[]>(note.tags ?? [])
    const [attachments, setAttachments] = useState<NoteAttachment[]>(note.attachments ?? [])
    const [isUploading, setIsUploading] = useState(false)

    const handleDeleteNote = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const formData = new FormData()
            formData.append("noteId", note.id)
            formData.append("subject_id", subjectId)
            toast.loading("Deletando anotação...", { id: "delete-note" })
            const res = await deleteNoteAction(formData)

            if (res.success) {
                toast.success(res.message, { id: "delete-note" })
            } else {
                toast.error(res.message, { id: "delete-note" })
            }
        } catch (error) {
            console.error("Erro ao deletar anotação:", error);
            toast.error("Erro ao deletar anotação.", { id: "delete-note" })
        }
    }

    const handlePinNote = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const formData = new FormData()
            formData.append("noteId", note.id)
            formData.append("content", note.content)
            formData.append("title", note.title)
            formData.append("isPinned", (!note.is_pined).toString())
            formData.append("subject_id", subjectId)
            toast.loading("Fixando anotação...", { id: "pin-note" })
            const res = await updateNoteAction(formData)

            if (res.success) {
                toast.success(res.message, { id: "pin-note" })
            } else {
                toast.error(res.message, { id: "pin-note" })
            }
        } catch (error) {
            console.error("Erro ao fixar a anotação:", error);
            toast.error("Erro ao fixar a anotação.", { id: "pin-note" })
        }
    }

    const handleUpdateNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isUploading) {
            toast.error("Aguarde o envio do anexo terminar.")
            return
        }

        try {
            const formData = new FormData()
            formData.append("noteId", note.id)
            formData.append("content", content)
            formData.append("title", title)
            formData.append("tags", JSON.stringify(tags))
            formData.append("isPinned", (note.is_pined).toString())
            formData.append("subject_id", subjectId)
            toast.loading("Editando nota...", { id: "update-note" })
            const res = await updateNoteAction(formData)

            if (res.success) {
                toast.success(res.message, { id: "update-note" })
                setIsOpenDialog(false)
            } else {
                // Mantém o diálogo aberto para a pessoa não perder as mudanças.
                toast.error(res.message, { id: "update-note" })
            }
        } catch (error) {
            console.error("Erro ao editar nota:", error)
            toast.error("Erro ao editar nota. Tente novamente.", { id: "update-note" })
        }
    }

    // Com a nota já salva, cada arquivo escolhido é enviado na hora.
    const handlePickFiles = async (files: File[]) => {
        setIsUploading(true)

        try {
            for (const file of files) {
                const formData = new FormData()
                formData.append("noteId", note.id)
                formData.append("subject_id", subjectId)
                formData.append("file", file)

                toast.loading(`Enviando ${file.name}...`, { id: "upload-note-attachment" })
                const res = await uploadNoteAttachmentAction(formData)

                if (res.success && res.attachments) {
                    setAttachments(res.attachments)
                    toast.success("Anexo enviado!", { id: "upload-note-attachment" })
                } else {
                    toast.error(res.message, { id: "upload-note-attachment" })
                }
            }
        } catch (error) {
            console.error("Erro ao enviar anexo:", error)
            toast.error("Erro ao enviar o anexo.", { id: "upload-note-attachment" })
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveAttachment = async (attachment: NoteAttachment) => {
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("noteId", note.id)
            formData.append("subject_id", subjectId)
            formData.append("public_id", attachment.public_id)

            toast.loading("Removendo anexo...", { id: "remove-note-attachment" })
            const res = await deleteNoteAttachmentAction(formData)

            if (res.success && res.attachments) {
                setAttachments(res.attachments)
                toast.success("Anexo removido!", { id: "remove-note-attachment" })
            } else {
                toast.error(res.message, { id: "remove-note-attachment" })
            }
        } catch (error) {
            console.error("Erro ao remover anexo:", error)
            toast.error("Erro ao remover o anexo.", { id: "remove-note-attachment" })
        } finally {
            setIsUploading(false)
        }
    }

    const handleExportPdf = async () => {
        setIsExportOpen(false)
        try {
            await exportNoteAsPdf(note, DOMPurify.sanitize(note.content))
        } catch (error) {
            console.error("Erro ao exportar PDF:", error)
            toast.error("Não foi possível abrir a impressão da nota.")
        }
    }

    const handleExportMarkdown = () => {
        setIsExportOpen(false)
        try {
            exportNoteAsMarkdown(note)
            toast.success("Markdown baixado!")
        } catch (error) {
            console.error("Erro ao exportar Markdown:", error)
            toast.error("Não foi possível exportar a nota.")
        }
    }

    return (
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Ações da nota">
            <Button variant="ghost" size="icon" title="Fixar nota" onClick={handlePinNote}>
                <Pin className={`h-4 w-4 ${note.is_pined ? "text-primary" : ""}`} />
                <span className="sr-only">Fixar nota {note.title}</span>
            </Button>

            <Popover open={isExportOpen} onOpenChange={setIsExportOpen}>
                <PopoverTrigger
                    render={
                        <Button variant="ghost" size="icon" title="Exportar nota">
                            <FileDown className="h-4 w-4" />
                            <span className="sr-only">Exportar nota {note.title}</span>
                        </Button>
                    }
                />
                <PopoverContent align="end" className="w-60 gap-0.5 p-1.5">
                    <Button type="button" variant="ghost" className="h-auto justify-start gap-3 px-2.5 py-2" onClick={handleExportPdf}>
                        <FileText className="size-4 shrink-0" />
                        <span className="flex flex-col items-start text-left">
                            <span>Salvar como PDF</span>
                            <span className="text-xs font-normal text-muted-foreground">Abre a impressão do navegador</span>
                        </span>
                    </Button>
                    <Button type="button" variant="ghost" className="h-auto justify-start gap-3 px-2.5 py-2" onClick={handleExportMarkdown}>
                        <FileDown className="size-4 shrink-0" />
                        <span className="flex flex-col items-start text-left">
                            <span>Baixar Markdown</span>
                            <span className="text-xs font-normal text-muted-foreground">Arquivo .md com tags e links</span>
                        </span>
                    </Button>
                </PopoverContent>
            </Popover>

            <DialogDemo
                contentBtn={
                    <Button variant="ghost" size="icon" title="Editar nota">
                        <PencilLine className="h-4 w-4" />
                        <span className="sr-only">Editar nota {note.title}</span>
                    </Button>
                }
                title="Editar Nota"
                description=" "
                onSubmit={handleUpdateNote}
                onOpenChange={setIsOpenDialog}
                open={isOpenDialog}
                variant="label"
                contentClassName="sm:max-w-xl"
            >
                <FieldGroup >
                    <Field className="space-y-2">
                        <Label htmlFor={`title-input-${note.id}`}>Título:</Label>
                        <Input id={`title-input-${note.id}`} name="title" placeholder="Ex: Equivalência Lógica" required value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Field>

                    <Field className="space-y-2">
                        <Label htmlFor={`content-editor-${note.id}`}>Anotação:</Label>
                        <div id={`content-editor-${note.id}`}>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                currentNoteId={note.id}
                            />
                        </div>
                    </Field>

                    <Field className="space-y-2">
                        <Label htmlFor={`tags-input-${note.id}`}>Tags:</Label>
                        <TagInput id={`tags-input-${note.id}`} value={tags} onChange={setTags} suggestions={tagSuggestions} />
                    </Field>

                    <Field className="space-y-2">
                        <Label>Anexos:</Label>
                        <NoteAttachmentsField
                            existing={attachments}
                            noteId={note.id}
                            busy={isUploading}
                            onPick={handlePickFiles}
                            onRemoveExisting={handleRemoveAttachment}
                        />
                    </Field>
                </FieldGroup>
            </DialogDemo>

            <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive" title="Excluir nota"
                onClick={handleDeleteNote}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir nota {note.title}</span>
            </Button>
        </div>
    )
}

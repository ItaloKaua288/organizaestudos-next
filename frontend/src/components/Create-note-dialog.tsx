"use client"

import { addNoteAction, uploadNoteAttachmentAction } from "@/actions/notes.actions"
import { DialogDemo } from "@/components/dialog-button"
import { NoteAttachmentsField } from "@/components/note-attachments-field"
import dynamic from "next/dynamic"
import { TagInput } from "@/components/tag-input"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

// O editor (Tiptap) é pesado: só é baixado quando a tela de edição realmente abre.
const RichTextEditor = dynamic(
    () => import("@/components/rich-text-editor").then((m) => m.RichTextEditor),
    { ssr: false, loading: () => <div className="min-h-40 animate-pulse rounded-xl bg-foreground/5" /> }
);

interface CreateNoteDialogProps {
    subjectId: string
    /** Tags já usadas nesta matéria, sugeridas ao digitar. */
    tagSuggestions?: string[]
}

export function CreateNoteDialog({ subjectId, tagSuggestions }: CreateNoteDialogProps) {
    const [conteudo, setConteudo] = useState("")
    const [tags, setTags] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [isOpenDialog, setIsOpenDialog] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const resetForm = () => {
        setConteudo("")
        setTags([])
        setFiles([])
    }

    const handleSubmitCreateNote = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSaving) return

        try {
            setIsSaving(true)
            const formData = new FormData(e.target as HTMLFormElement)
            formData.append("subject_id", subjectId)
            formData.append("content", conteudo)
            formData.append("tags", JSON.stringify(tags))
            toast.loading("Criando nota...", { id: "create-note" })
            const res = await addNoteAction(formData)

            if (!res.success) {
                // Mantém o diálogo aberto para a pessoa não perder o que escreveu.
                toast.error(res.message, { id: "create-note" })
                return
            }

            // A nota só tem id depois de salva, então os anexos vão em seguida.
            if (files.length > 0 && res.noteId) {
                let failed = 0

                for (const [index, file] of files.entries()) {
                    toast.loading(`Enviando anexo ${index + 1} de ${files.length}...`, { id: "create-note" })

                    const uploadData = new FormData()
                    uploadData.append("noteId", res.noteId)
                    uploadData.append("subject_id", subjectId)
                    uploadData.append("file", file)

                    const upload = await uploadNoteAttachmentAction(uploadData)
                    if (!upload.success) failed += 1
                }

                if (failed > 0) {
                    toast.error(`Nota criada, mas ${failed} anexo(s) não foram enviados. Anexe-os editando a nota.`, { id: "create-note" })
                } else {
                    toast.success(res.message, { id: "create-note" })
                }
            } else {
                toast.success(res.message, { id: "create-note" })
            }

            resetForm()
            setIsOpenDialog(false)
        } catch (error) {
            console.error("Erro ao criar nota:", error)
            toast.error("Erro ao criar nota. Tente novamente.", { id: "create-note" })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <DialogDemo
            contentBtn={
                <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Nova Nota</span>
                </span>
            }
            title="Nova Nota"
            description="Crie uma nova nota para sua matéria"
            onSubmit={handleSubmitCreateNote}
            onOpenChange={setIsOpenDialog}
            open={isOpenDialog}
            contentClassName="sm:max-w-xl"
        >
            <FieldGroup >
                <Field className="space-y-2">
                    <Label htmlFor="title-input">Título:</Label>
                    <Input id="title-input" name="title" placeholder="Ex: Equivalência Lógica" required />
                </Field>

                <Field className="space-y-2">
                    <Label htmlFor="content-editor">Anotação:</Label>
                    <div id="content-editor">
                        <RichTextEditor
                            value={conteudo}
                            onChange={setConteudo}
                        />
                    </div>
                </Field>

                <Field className="space-y-2">
                    <Label htmlFor="tags-input">Tags:</Label>
                    <TagInput id="tags-input" value={tags} onChange={setTags} suggestions={tagSuggestions} />
                </Field>

                <Field className="space-y-2">
                    <Label>Anexos:</Label>
                    <NoteAttachmentsField
                        existing={[]}
                        pending={files}
                        onPick={(picked) => setFiles((current) => [...current, ...picked])}
                        onRemovePending={(index) => setFiles((current) => current.filter((_, i) => i !== index))}
                        onRemoveExisting={() => undefined}
                    />
                </Field>
            </FieldGroup>
        </DialogDemo>
    )
}

"use client"

import { addNoteAction } from "@/actions/notes.actions"
import { DialogDemo } from "@/components/dialog-button"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

interface CreateNoteDialogProps {
    subjectId: string
}

export function CreateNoteDialog({ subjectId }: CreateNoteDialogProps) {
    const [conteudo, setConteudo] = useState("")
    const [isOpenDialog, setIsOpenDialog] = useState(false)

    const handleSubmitCreateNote = async (e: React.FormEvent) => {
        try {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            formData.append("subject_id", subjectId)
            formData.append("content", conteudo)
            const res = await addNoteAction(formData)

            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.message)
            }
            setIsOpenDialog(false)
        } catch (error) {
            console.error("Erro ao criar nota:", error)
            toast.error("Erro ao criar nota. Tente novamente.")
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
            </FieldGroup>
        </DialogDemo>
    )
}
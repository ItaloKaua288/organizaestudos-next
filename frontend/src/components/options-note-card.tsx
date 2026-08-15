"use client"

import { deleteNoteAction, updateNoteAction } from "@/actions/notes.actions";
import { DialogDemo } from "@/components/dialog-button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Note } from "@/types/note";
import { PencilLine, Pin, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface OptionsNoteCardProps {
    subjectId: string;
    note: Note;
}

export function OptionsNoteCard({ subjectId, note }: OptionsNoteCardProps) {
    const [isOpenDialog, setIsOpenDialog] = useState(false)
    const [content, setContent] = useState(note.content)
    const [title, setTitle] = useState(note.title)

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
        try {
            e.preventDefault()
            const formData = new FormData()
            formData.append("noteId", note.id)
            formData.append("content", content)
            formData.append("title", title)
            formData.append("isPinned", (note.is_pined).toString())
            formData.append("subject_id", subjectId)
            toast.loading("Editando nota...", { id: "update-note" })
            const res = await updateNoteAction(formData)

            if (res.success) {
                toast.success(res.message, { id: "update-note" })
            } else {
                toast.error(res.message, { id: "update-note" })
            }
            setIsOpenDialog(false)
        } catch (error) {
            console.error("Erro ao criar nota:", error)
            toast.error("Erro ao criar nota. Tente novamente.", { id: "update-note" })
        }
    }

    return (
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Ações da nota">
            <Button variant="ghost" size="icon" title="Fixar nota" onClick={handlePinNote}>
                <Pin className={`h-4 w-4 ${note.is_pined ? "text-primary" : ""}`} />
                <span className="sr-only">Fixar nota {note.title}</span>
            </Button>
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
            >
                <FieldGroup >
                    <Field className="space-y-2">
                        <Label htmlFor="title-input">Título:</Label>
                        <Input id="title-input" name="title" placeholder="Ex: Equivalência Lógica" required value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Field>

                    <Field className="space-y-2">
                        <Label htmlFor="content-editor">Anotação:</Label>
                        <div id="content-editor">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                            />
                        </div>
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
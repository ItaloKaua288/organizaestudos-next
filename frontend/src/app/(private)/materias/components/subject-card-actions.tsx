"use client";

import { deleteSubjectAction, updateSubjectAction } from "@/actions/subjects.actions";
import { DialogDemo } from "@/components/dialog-button";
import { SubjectActiveToggle } from "@/components/subject-active-toggle";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subject } from "@/types/subject";
import { PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

/** Botão de ícone discreto (ghost), igual ao usado na caixa detalhada. */
const ICON_BTN =
    "size-8 rounded-lg border-transparent bg-transparent p-0 text-muted-foreground shadow-none backdrop-blur-none hover:bg-foreground/8 hover:text-foreground aria-expanded:bg-foreground/8";

/** Ações do card compacto (editar, ativar/desativar, excluir). O pai decide quando mostrá-las. */
export function SubjectCardActions({ subject, redirectAfterDelete }: { subject: Subject; /** Rota para ir depois de excluir (usado na página da própria matéria). */ redirectAfterDelete?: string }) {
    const router = useRouter();
    const [draftColor, setDraftColor] = useState(subject.color);
    const [isPending, setIsPending] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            toast.loading("Atualizando matéria...", { id: "update-subject" });

            const formData = new FormData(e.currentTarget as HTMLFormElement);
            formData.append("color", draftColor);
            formData.append("subject_id", subject.id);

            await updateSubjectAction(formData);
            toast.success("Matéria atualizada", { id: "update-subject" });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Falha ao atualizar a matéria", error);
            toast.error("Falha ao atualizar a matéria", { id: "update-subject" });
        } finally {
            setIsPending(false);
        }
    };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            toast.loading("Deletando matéria...", { id: "delete-subject" });
            const formData = new FormData();
            formData.append("subject_id", subject.id);
            await deleteSubjectAction(formData);
            toast.success("Matéria deletada", { id: "delete-subject" });
            if (redirectAfterDelete) router.push(redirectAfterDelete);
        } catch (error) {
            console.error("Falha ao deletar a matéria", error);
            toast.error("Falha ao deletar a matéria", { id: "delete-subject" });
        } finally {
            setIsPending(false);
        }
    };

    const isActive = subject.active !== false;

    return (
        <div className="flex items-center gap-0.5">
            <DialogDemo
                title="Editar a matéria"
                description="Modifique os detalhes desta matéria."
                contentBtn={<><PencilLine size={15} /><span className="sr-only">Editar matéria</span></>}
                classNameBtn={ICON_BTN}
                onSubmit={handleEdit}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            >
                <FieldGroup>
                    <Field>
                        <Label>Nome</Label>
                        <Input name="title" defaultValue={subject.title} disabled={isPending} />
                    </Field>
                    <Field>
                        <Label>Cor</Label>
                        <ColorPicker value={draftColor} onChange={setDraftColor} />
                    </Field>
                </FieldGroup>
            </DialogDemo>

            <SubjectActiveToggle subjectId={subject.id} active={isActive} iconClassName={`${ICON_BTN} cursor-pointer`} />

            <DialogDemo
                title="Deletar matéria"
                description="Tem certeza que deseja deletar a matéria? Esta ação é irreversível."
                contentBtn={<><Trash2 size={15} /><span className="sr-only">Deletar matéria</span></>}
                classNameBtn={`${ICON_BTN} hover:text-destructive`}
                nameConfirmBtn="Excluir"
                variantConfirmBtn="destructive"
                onSubmit={handleDelete}
            />
        </div>
    );
}

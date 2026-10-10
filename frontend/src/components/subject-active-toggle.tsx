"use client";

import { toggleSubjectActiveAction } from "@/actions/subjects.actions";
import { DialogDemo } from "@/components/dialog-button";
import { Button } from "@/components/ui/button";
import { Power, PowerOff } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type SubjectActiveToggleProps = {
    subjectId: string;
    active: boolean;
};

export function SubjectActiveToggle({ subjectId, active }: SubjectActiveToggleProps) {
    const [isPending, setIsPending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const changeState = async (nextActive: boolean) => {
        const toastId = "toggle-subject-active";

        try {
            setIsPending(true);
            toast.loading(nextActive ? "Ativando matéria..." : "Desativando matéria...", { id: toastId });

            const formData = new FormData();
            formData.append("subject_id", subjectId);
            formData.append("active", String(nextActive));

            const result = await toggleSubjectActiveAction(formData);

            if (result.success) {
                toast.success(result.message, { id: toastId });
                setIsOpen(false);
            } else {
                toast.error(result.message, { id: toastId });
            }
        } catch (error) {
            console.error("Falha ao alterar o estado da matéria", error);
            toast.error("Falha ao alterar o estado da matéria", { id: toastId });
        } finally {
            setIsPending(false);
        }
    };

    if (!active) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => changeState(true)}
                className="gap-1"
            >
                <Power size={15} />
                Reativar
            </Button>
        );
    }

    return (
        <DialogDemo
            title="Desativar matéria"
            description="Ao desativar, a matéria some das revisões, do cronograma, do dashboard e das anotações, e não poderá receber novos assuntos ou notas. Nada é apagado: ao reativar, tudo volta como estava."
            contentBtn={<PowerOff size={15} />}
            classNameBtn="border-none dark:bg-transparent bg-transparent dark:hover:bg-transparent cursor-pointer"
            nameConfirmBtn={isPending ? "Desativando..." : "Desativar"}
            variantConfirmBtn="destructive"
            open={isOpen}
            onOpenChange={setIsOpen}
            onSubmit={(e) => {
                e.preventDefault();
                changeState(false);
            }}
        />
    );
}

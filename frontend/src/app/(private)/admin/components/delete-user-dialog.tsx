"use client";

import { deleteUserAdminAction } from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminUser } from "@/types/admin";
import { useState } from "react";
import toast from "react-hot-toast";
import { count } from "./admin-utils";

const TOAST_ID = "admin-delete-user";

interface DeleteUserDialogProps {
    user: AdminUser;
    onClose: () => void;
    onDeleted: (id: string) => void;
}

/** Exclusão definitiva: só libera o botão depois de digitar o e-mail da conta. */
export function DeleteUserDialog({ user, onClose, onDeleted }: DeleteUserDialogProps) {
    const [confirmation, setConfirmation] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const matches = confirmation.trim().toLowerCase() === user.email.trim().toLowerCase();

    const handleOpenChange = (open: boolean) => {
        if (!open && !isBusy) onClose();
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!matches || isBusy) return;
        setIsBusy(true);
        setError(null);

        try {
            const result = await deleteUserAdminAction(user._id);
            if (!result.success) {
                setError(result.message);
                return;
            }

            toast.success(result.message, { id: TOAST_ID });
            onDeleted(user._id);
            onClose();
        } catch {
            setError("Erro ao excluir o usuário.");
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog open onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle className="wrap-anywhere">Excluir {user.name}?</DialogTitle>
                        <DialogDescription>
                            Isso apaga a conta e todos os dados dela. Não dá para desfazer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <li>{count(user.subjectsCount, "matéria", "matérias")}</li>
                            <li>{count(user.topicsCount, "assunto", "assuntos")}</li>
                            <li>{count(user.attachmentsCount, "anexo", "anexos")}</li>
                            <li>{count(user.notesCount, "nota", "notas")}</li>
                        </ul>
                        <p className="text-xs text-muted-foreground">
                            Também saem os perfis de estudo, o ciclo de estudos e o histórico de questões. Os anexos são
                            removidos do armazenamento.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="admin-delete-confirm">Digite o e-mail da conta para confirmar</Label>
                        <p className="rounded-md bg-muted px-2.5 py-1.5 text-sm font-medium wrap-anywhere">{user.email}</p>
                        <Input
                            id="admin-delete-confirm"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="E-mail da conta"
                            disabled={isBusy}
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" type="button" disabled={isBusy} />}>
                            Cancelar
                        </DialogClose>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={!matches || isBusy}
                            className="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
                        >
                            {isBusy ? "Excluindo..." : "Excluir usuário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { updateUserAdminAction } from "@/actions/admin.actions";
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
import { AdminUser, AdminUserUpdated } from "@/types/admin";
import { useState } from "react";
import toast from "react-hot-toast";

const TOAST_ID = "admin-edit-user";
const MAX_NAME_LENGTH = 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EditUserDialogProps {
    user: AdminUser;
    /** true quando está editando a própria conta (não pode tirar o próprio acesso de admin). */
    isSelf: boolean;
    onClose: () => void;
    onSaved: (user: AdminUserUpdated) => void;
}

function CheckField({
    label,
    description,
    checked,
    disabled,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary outline-none"
            />
            <span className="space-y-0.5">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
            </span>
        </label>
    );
}

/** Edição de nome, e-mail e permissões de um usuário. */
export function EditUserDialog({ user, isSelf, onClose, onSaved }: EditUserDialogProps) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isAdmin, setIsAdmin] = useState(user.isAdmin);
    const [isVerified, setIsVerified] = useState(user.isVerified);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim();
    const isEmailValid = EMAIL_REGEX.test(cleanEmail);

    const hasChanges =
        cleanName !== user.name ||
        cleanEmail !== user.email ||
        isAdmin !== user.isAdmin ||
        isVerified !== user.isVerified;
    const canSave = !isBusy && hasChanges && cleanName.length > 0 && isEmailValid;

    const handleOpenChange = (open: boolean) => {
        if (!open && !isBusy) onClose();
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSave) return;
        setIsBusy(true);
        setError(null);

        try {
            const result = await updateUserAdminAction(user._id, {
                name: cleanName,
                email: cleanEmail,
                isAdmin,
                isVerified,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            toast.success(result.message, { id: TOAST_ID });
            onSaved(
                result.user ?? {
                    _id: user._id,
                    name: cleanName,
                    email: cleanEmail,
                    isAdmin,
                    isVerified,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                    totalStudyTime: user.totalStudyTime,
                }
            );
            onClose();
        } catch {
            setError("Erro ao atualizar o usuário.");
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog open onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>Editar usuário</DialogTitle>
                        <DialogDescription>
                            Altere os dados da conta e as permissões de acesso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-name">Nome</Label>
                        <Input
                            id="admin-edit-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={MAX_NAME_LENGTH}
                            autoComplete="off"
                            disabled={isBusy}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="admin-edit-email">E-mail</Label>
                        <Input
                            id="admin-edit-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="off"
                            aria-invalid={cleanEmail.length > 0 && !isEmailValid}
                            disabled={isBusy}
                        />
                        {cleanEmail.length > 0 && !isEmailValid && (
                            <p className="text-xs text-destructive">Informe um e-mail válido, como nome@exemplo.com.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <CheckField
                            label="Administrador"
                            description={
                                isSelf
                                    ? "Você não pode remover o seu próprio acesso de administrador."
                                    : "Acessa esta página e gerencia todas as contas."
                            }
                            checked={isAdmin}
                            disabled={isSelf || isBusy}
                            onChange={setIsAdmin}
                        />
                        <CheckField
                            label="E-mail verificado"
                            description="Marque quando o e-mail já foi confirmado."
                            checked={isVerified}
                            disabled={isBusy}
                            onChange={setIsVerified}
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
                        <Button type="submit" disabled={!canSave}>
                            {isBusy ? "Salvando..." : "Salvar alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

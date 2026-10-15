"use client";

import { changePasswordAction } from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const TOAST_ID = "profile-password";
const MIN_PASSWORD_LENGTH = 8;

/** Troca de senha: exige a senha atual e a confirmação da nova senha. */
export function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [isBusy, setIsBusy] = useState(false);

    const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
    const canSave =
        !isBusy &&
        currentPassword.length > 0 &&
        newPassword.length >= MIN_PASSWORD_LENGTH &&
        newPassword === confirmPassword;

    const inputType = showPasswords ? "text" : "password";

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSave) return;
        setIsBusy(true);
        toast.loading("Alterando senha...", { id: TOAST_ID });

        try {
            const result = await changePasswordAction(currentPassword, newPassword);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswords(false);
        } catch {
            toast.error("Erro ao alterar a senha.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 sm:p-7" aria-labelledby="password-title">
            <div className="space-y-1">
                <h2 id="password-title" className="text-lg font-medium">
                    Senha
                </h2>
                <p className="text-sm text-muted-foreground">Para trocar, confirme a senha atual.</p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                    id="current-password"
                    type={inputType}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isBusy}
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                    id="new-password"
                    type={inputType}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={72}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-describedby="new-password-hint"
                    disabled={isBusy}
                />
                <p id="new-password-hint" className="text-xs text-muted-foreground">
                    Mínimo de {MIN_PASSWORD_LENGTH} caracteres.
                </p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                    id="confirm-password"
                    type={inputType}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={mismatch}
                    aria-describedby={mismatch ? "confirm-password-error" : undefined}
                    disabled={isBusy}
                />
                {mismatch && (
                    <p id="confirm-password-error" role="alert" className="text-xs text-destructive">
                        As senhas não coincidem.
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="submit" disabled={!canSave}>
                    Alterar senha
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswords((value) => !value)}
                    aria-pressed={showPasswords}
                >
                    {showPasswords ? <EyeOff /> : <Eye />}
                    {showPasswords ? "Ocultar senhas" : "Mostrar senhas"}
                </Button>
            </div>
        </form>
    );
}

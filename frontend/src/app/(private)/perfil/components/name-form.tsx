"use client";

import { updateNameAction } from "@/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const TOAST_ID = "profile-name";

/** Edição do nome de exibição do usuário. */
export function NameForm({ currentName }: { currentName: string }) {
    const router = useRouter();
    const [name, setName] = useState(currentName);
    const [savedName, setSavedName] = useState(currentName);
    const [isBusy, setIsBusy] = useState(false);

    const trimmed = name.trim().replace(/\s+/g, " ");
    const canSave = !isBusy && trimmed.length > 0 && trimmed !== savedName;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSave) return;
        setIsBusy(true);
        toast.loading("Salvando nome...", { id: TOAST_ID });

        try {
            const result = await updateNameAction(trimmed);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            const newName = result.name ?? trimmed;
            setSavedName(newName);
            setName(newName);
            router.refresh();
        } catch {
            toast.error("Erro ao atualizar o nome.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="name-title">
            <div className="space-y-1">
                <h2 id="name-title" className="text-lg font-semibold">
                    Nome
                </h2>
                <p className="text-sm text-muted-foreground">É assim que você aparece no seu perfil.</p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="profile-name">Nome completo</Label>
                <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    autoComplete="name"
                    disabled={isBusy}
                />
            </div>

            <Button type="submit" disabled={!canSave} className="mt-auto self-start">
                Salvar nome
            </Button>
        </form>
    );
}

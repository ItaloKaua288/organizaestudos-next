"use client";

import { updateProfileReviewLimitAction } from "@/actions/profiles.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type ReviewLimitControlProps = {
    profileId: string;
    /** Limite atual de revisões por dia ou null quando não há limite. */
    limit: number | null;
};

const TOAST_ID = "review-daily-limit";
const MAX_LIMIT = 200;

/** Botão + janela para definir o máximo de revisões em um único dia (vale para o perfil ativo). */
export function ReviewLimitControl({ profileId, limit }: ReviewLimitControlProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(limit ? String(limit) : "");
    const [isBusy, setIsBusy] = useState(false);

    const parsed = value.trim() === "" ? null : Number(value);
    const isValid = parsed !== null && Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_LIMIT;

    const handleOpenChange = (next: boolean) => {
        if (isBusy) return;
        if (next) setValue(limit ? String(limit) : "");
        setOpen(next);
    };

    const save = async (nextLimit: number | null) => {
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Salvando limite diário...", { id: TOAST_ID });

        try {
            const result = await updateProfileReviewLimitAction(profileId, nextLimit);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setOpen(false);
            router.refresh();
        } catch {
            toast.error("Erro ao salvar o limite diário.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)} aria-haspopup="dialog">
                <Gauge data-icon="inline-start" />
                {limit ? `Limite: ${limit}/dia` : "Limite diário"}
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-sm">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (isValid) void save(parsed);
                        }}
                        className="flex flex-col gap-4"
                    >
                        <DialogHeader>
                            <DialogTitle>Limite diário de revisões</DialogTitle>
                            <DialogDescription>
                                Máximo de revisões em um único dia, no perfil ativo. Quando o dia da próxima revisão já estiver cheio, ela vai para o dia mais próximo depois dele que ainda tem vaga. As revisões já agendadas não mudam.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="review-daily-limit">Revisões por dia</Label>
                            <Input
                                id="review-daily-limit"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={MAX_LIMIT}
                                step={1}
                                placeholder="Sem limite"
                                value={value}
                                onChange={(event) => setValue(event.target.value)}
                                disabled={isBusy}
                                aria-invalid={value.trim() !== "" && !isValid}
                            />
                            <p className="text-xs text-muted-foreground">
                                {value.trim() !== "" && !isValid ? `Use um número inteiro de 1 a ${MAX_LIMIT}.` : "Deixe vazio para não limitar."}
                            </p>
                        </div>

                        <DialogFooter>
                            {limit && (
                                <Button type="button" variant="ghost" disabled={isBusy} onClick={() => void save(null)}>
                                    Remover limite
                                </Button>
                            )}
                            <Button type="submit" disabled={isBusy || !isValid}>
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

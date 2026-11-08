"use client";

import { updateDeckSettingsAction } from "@/actions/flashcards.actions";
import { DialogDemo } from "@/components/dialog-button";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_DECK_SETTINGS, Deck, DeckSettings } from "@/types/flashcard";
import { Settings2 } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

/** Texto do formulário (tudo string, para o usuário poder apagar/digitar à vontade). */
interface SettingsForm {
    newPerDay: string;
    reviewsPerDay: string;
    learningSteps: string;
    relearningSteps: string;
    graduatingInterval: string;
    easyInterval: string;
}

const toForm = (settings: DeckSettings): SettingsForm => ({
    newPerDay: String(settings.newPerDay),
    reviewsPerDay: String(settings.reviewsPerDay),
    learningSteps: settings.learningSteps.join(" "),
    relearningSteps: settings.relearningSteps.join(" "),
    graduatingInterval: String(settings.graduatingInterval),
    easyInterval: String(settings.easyInterval),
});

/** "1 10" ou "1, 10" -> [1, 10]. Valores inválidos viram NaN e são barrados na validação. */
const parseSteps = (text: string) =>
    text.split(/[\s,;]+/).filter(Boolean).map((value) => Number(value.replace(",", ".")));

function parseForm(form: SettingsForm): { settings?: DeckSettings; error?: string } {
    const int = (value: string) => (value.trim() === "" ? NaN : Number(value));

    const settings: DeckSettings = {
        newPerDay: int(form.newPerDay),
        reviewsPerDay: int(form.reviewsPerDay),
        learningSteps: parseSteps(form.learningSteps),
        relearningSteps: parseSteps(form.relearningSteps),
        graduatingInterval: int(form.graduatingInterval),
        easyInterval: int(form.easyInterval),
    };

    const validCount = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
    const validSteps = (steps: number[]) => steps.length >= 1 && steps.length <= 8 && steps.every((step) => Number.isFinite(step) && step > 0 && step <= 43200);

    if (!validCount(settings.newPerDay, 0, 9999)) return { error: "Novos por dia: use um número inteiro de 0 a 9999." };
    if (!validCount(settings.reviewsPerDay, 0, 9999)) return { error: "Revisões por dia: use um número inteiro de 0 a 9999." };
    if (!validSteps(settings.learningSteps)) return { error: "Passos de aprendizado: informe de 1 a 8 valores em minutos, ex.: 1 10." };
    if (!validSteps(settings.relearningSteps)) return { error: "Passos de reaprendizado: informe de 1 a 8 valores em minutos, ex.: 10." };
    if (!validCount(settings.graduatingInterval, 1, 365)) return { error: "Intervalo ao graduar: de 1 a 365 dias." };
    if (!validCount(settings.easyInterval, 1, 365)) return { error: "Intervalo do botão Fácil: de 1 a 365 dias." };
    if (settings.easyInterval < settings.graduatingInterval) return { error: "O intervalo do Fácil não pode ser menor que o intervalo ao graduar." };

    return { settings };
}

/** Configurações de estudo do baralho: limites diários e passos de aprendizado. */
export function DeckSettingsDialog({ deck }: { deck: Deck }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<SettingsForm>(() => toForm(deck.settings));

    const set = (key: keyof SettingsForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((current) => ({ ...current, [key]: event.target.value }));

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { settings, error } = parseForm(form);
        if (!settings) {
            toast.error(error ?? "Configurações inválidas.");
            return;
        }

        toast.loading("Salvando...", { id: "deck-settings" });
        const result = await updateDeckSettingsAction(deck.id, settings);

        if (!result.success) {
            toast.error(result.message, { id: "deck-settings" });
            return;
        }

        toast.success(result.message, { id: "deck-settings" });
        setOpen(false);
    }

    return (
        <DialogDemo
            contentBtn={<Settings2 className="size-4" />}
            title="Configurações de estudo"
            description={`Valem só para o baralho "${deck.name}" e não alteram o progresso já feito.`}
            nameConfirmBtn="Salvar"
            onSubmit={handleSubmit}
            open={open}
            onOpenChange={(next) => {
                if (next) setForm(toForm(deck.settings));
                setOpen(next);
            }}
            classNameBtn="size-8 p-0"
            contentClassName="sm:max-w-md"
        >
            <FieldGroup>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Limites por dia</p>
                <div className="grid grid-cols-2 gap-3">
                    <Field>
                        <Label htmlFor="ds-new">Cartões novos</Label>
                        <Input id="ds-new" inputMode="numeric" value={form.newPerDay} onChange={set("newPerDay")} />
                    </Field>
                    <Field>
                        <Label htmlFor="ds-reviews">Revisões</Label>
                        <Input id="ds-reviews" inputMode="numeric" value={form.reviewsPerDay} onChange={set("reviewsPerDay")} />
                    </Field>
                </div>
                <p className="-mt-2 text-xs text-muted-foreground">Use 0 para pausar os cartões novos. O dia vira à meia-noite (Brasília).</p>

                <p className="mt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Aprendizado</p>
                <Field>
                    <Label htmlFor="ds-learning">Passos de aprendizado (minutos)</Label>
                    <Input id="ds-learning" value={form.learningSteps} onChange={set("learningSteps")} placeholder="1 10" />
                    <p className="text-xs text-muted-foreground">Separe por espaço. Com “1 10”, o cartão volta em 1 min e depois em 10 min até virar revisão.</p>
                </Field>
                <Field>
                    <Label htmlFor="ds-relearning">Passos ao errar uma revisão (minutos)</Label>
                    <Input id="ds-relearning" value={form.relearningSteps} onChange={set("relearningSteps")} placeholder="10" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field>
                        <Label htmlFor="ds-graduating">Ao graduar (dias)</Label>
                        <Input id="ds-graduating" inputMode="numeric" value={form.graduatingInterval} onChange={set("graduatingInterval")} />
                    </Field>
                    <Field>
                        <Label htmlFor="ds-easy">Botão Fácil (dias)</Label>
                        <Input id="ds-easy" inputMode="numeric" value={form.easyInterval} onChange={set("easyInterval")} />
                    </Field>
                </div>

                <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setForm(toForm(DEFAULT_DECK_SETTINGS))}>
                    Restaurar padrão
                </Button>
            </FieldGroup>
        </DialogDemo>
    );
}

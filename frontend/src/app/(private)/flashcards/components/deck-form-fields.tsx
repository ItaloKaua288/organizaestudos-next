"use client";

import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface DeckFormValues {
    name: string;
    description: string;
    color: string;
}

export const EMPTY_DECK_FORM: DeckFormValues = { name: "", description: "", color: "#3b82f6" };

/** Campos de criar/editar baralho (usados dentro de um DialogDemo). */
export function DeckFormFields({ values, onChange, idPrefix }: {
    values: DeckFormValues;
    onChange: (values: DeckFormValues) => void;
    idPrefix: string;
}) {
    return (
        <FieldGroup>
            <Field>
                <Label htmlFor={`${idPrefix}-name`}>Nome</Label>
                <Input
                    id={`${idPrefix}-name`}
                    placeholder="Ex.: Direito Constitucional"
                    maxLength={80}
                    value={values.name}
                    onChange={(e) => onChange({ ...values, name: e.target.value })}
                />
            </Field>
            <Field>
                <Label htmlFor={`${idPrefix}-description`}>Descrição (opcional)</Label>
                <Textarea
                    id={`${idPrefix}-description`}
                    className="min-h-16"
                    maxLength={300}
                    placeholder="Sobre o que é este baralho?"
                    value={values.description}
                    onChange={(e) => onChange({ ...values, description: e.target.value })}
                />
            </Field>
            <Field>
                <Label>Cor</Label>
                <ColorPicker value={values.color} onChange={(color) => onChange({ ...values, color })} />
            </Field>
        </FieldGroup>
    );
}

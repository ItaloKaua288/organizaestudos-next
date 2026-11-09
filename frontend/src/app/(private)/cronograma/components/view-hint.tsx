"use client";

import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useState } from "react";
import { VIEW_HINT_COOKIE } from "./view-cookie";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Explicação de uma linha sobre Semana x Ciclo; aparece até a pessoa dispensar (lembrado por cookie). */
export function ViewHint() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    function dismiss() {
        document.cookie = `${VIEW_HINT_COOKIE}=1; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
        setVisible(false);
    }

    return (
        <div role="note" className="glass flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 text-sm">
            <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-balance text-muted-foreground">
                <span className="font-medium text-foreground">Dois jeitos de planejar:</span> a <strong className="font-medium text-foreground">Semana</strong> define
                dias fixos para cada matéria; o <strong className="font-medium text-foreground">Ciclo</strong> é uma sequência que avança no seu ritmo, sem depender do dia.
                Sua escolha fica salva neste navegador.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={dismiss}>
                Entendi
            </Button>
        </div>
    );
}

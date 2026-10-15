"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const TOTAL_TICKS = 48;

// Larguras variadas (determinísticas) para a faixa lembrar um código de barras de cartão de inscrição.
const weightOf = (index: number) => 1 + ((index * 7 + 3) % 5 === 0 ? 2 : (index * 5) % 3 === 0 ? 1 : 0);

/**
 * Faixa de barras que funciona como barra de progresso: as barras preenchidas
 * representam a parte concluída. As barras sobem uma após a outra ao abrir a página.
 */
export function ProgressTicks({ percent, label }: { percent: number; label: string }) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const safePercent = Math.min(100, Math.max(0, percent));
    const filled = Math.round((safePercent / 100) * TOTAL_TICKS);

    return (
        <div role="img" aria-label={label} className="flex h-12 items-stretch gap-[2px]">
            {Array.from({ length: TOTAL_TICKS }, (_, index) => (
                <span
                    key={index}
                    aria-hidden
                    style={{ flexGrow: weightOf(index), transitionDelay: `${index * 14}ms` }}
                    className={cn(
                        "basis-0 origin-bottom rounded-[1px] transition-transform duration-500 ease-out motion-reduce:transition-none",
                        index < filled ? "bg-primary" : "bg-background/25",
                        shown ? "scale-y-100" : "scale-y-0"
                    )}
                />
            ))}
        </div>
    );
}

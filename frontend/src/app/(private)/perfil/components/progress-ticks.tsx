import { cn } from "@/lib/utils";

const TOTAL_TICKS = 48;

/**
 * Faixa fina de marcas que funciona como barra de progresso: as marcas preenchidas
 * representam a parte concluída.
 */
export function ProgressTicks({ percent, label }: { percent: number; label: string }) {
    const safePercent = Math.min(100, Math.max(0, percent));
    const filled = Math.round((safePercent / 100) * TOTAL_TICKS);

    return (
        <div role="img" aria-label={label} className="flex h-8 items-stretch gap-[3px]">
            {Array.from({ length: TOTAL_TICKS }, (_, index) => (
                <span
                    key={index}
                    aria-hidden
                    className={cn("flex-1 rounded-full", index < filled ? "bg-primary" : "bg-foreground/15")}
                />
            ))}
        </div>
    );
}

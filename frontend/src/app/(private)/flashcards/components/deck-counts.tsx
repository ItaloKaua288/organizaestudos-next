import { cn } from "@/lib/utils";
import { DeckCounts } from "@/types/flashcard";

/** Os três números do Anki: Novos (azul), Aprender (vermelho) e Revisar (verde). */
export function DeckCountsBadges({ counts, className }: { counts: DeckCounts; className?: string }) {
    const items = [
        { label: "Novos", value: counts.new, color: "text-blue-600 dark:text-blue-400" },
        { label: "Aprender", value: counts.learning, color: "text-red-600 dark:text-red-400" },
        { label: "Revisar", value: counts.review, color: "text-emerald-600 dark:text-emerald-400" },
    ];

    return (
        <dl className={cn("flex items-center gap-4", className)}>
            {items.map((item) => (
                <div key={item.label} className="flex flex-col items-center leading-tight">
                    <dd className={cn("text-lg font-semibold tabular-nums", item.value === 0 ? "text-muted-foreground/60" : item.color)}>
                        {item.value}
                    </dd>
                    <dt className="text-[0.7rem] text-muted-foreground">{item.label}</dt>
                </div>
            ))}
        </dl>
    );
}

export const hasCardsToStudy = (counts: DeckCounts) => counts.new + counts.learning + counts.review > 0;

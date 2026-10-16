"use client";

import { cn } from "@/lib/utils";
import type { KanbanOrderMode } from "./kanban-order";

type Option = { mode: KanbanOrderMode; label: string; title: string; emptyTitle?: string };

const OPTIONS: readonly Option[] = [
    { mode: "padrao", label: "Padrão", title: "Ordem em que os assuntos foram cadastrados" },
    {
        mode: "cronograma",
        label: "Cronograma",
        title: "Matérias na ordem do cronograma semanal, a partir de hoje",
        emptyTitle: "Adicione matérias ao cronograma para usar esta ordem",
    },
    {
        mode: "ciclo",
        label: "Ciclo",
        title: "Matérias na ordem do ciclo de estudos, a partir da próxima sessão",
        emptyTitle: "Crie um ciclo de estudos para usar esta ordem",
    },
];

type KanbanOrderToggleProps = {
    value: KanbanOrderMode;
    /** Quais ordens têm matérias para seguir (o padrão está sempre disponível). */
    available: Record<KanbanOrderMode, boolean>;
    onChange: (mode: KanbanOrderMode) => void;
};

/** Escolha da ordem da coluna "A estudar": padrão, cronograma ou ciclo de estudos. */
export function KanbanOrderToggle({ value, available, onChange }: KanbanOrderToggleProps) {
    return (
        <div className="flex items-center gap-2">
            <span id="kanban-order-label" className="text-xs text-muted-foreground">
                Ordem
            </span>
            <div
                role="group"
                aria-labelledby="kanban-order-label"
                className="inline-flex items-center gap-0.5 rounded-lg bg-foreground/6 p-0.5 text-xs"
            >
                {OPTIONS.map(({ mode, label, title, emptyTitle }) => {
                    const enabled = available[mode];
                    const selected = value === mode;

                    return (
                        <button
                            key={mode}
                            type="button"
                            disabled={!enabled}
                            aria-pressed={selected}
                            title={enabled ? title : emptyTitle}
                            onClick={() => onChange(mode)}
                            className={cn(
                                "h-6 rounded-md px-2.5 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40",
                                selected
                                    ? "bg-(--glass-fill-strong) text-foreground shadow-[inset_0_1px_0_var(--glass-edge),0_0_0_1px_var(--glass-ring)]"
                                    : "text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

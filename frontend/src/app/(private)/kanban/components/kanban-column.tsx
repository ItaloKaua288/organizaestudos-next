"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Topic, TopicStatus } from "@/types/topic";
import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { KanbanCard } from "./kanban-card";
import { COLUMN_PAGE_SIZE, type KanbanColumnConfig } from "./kanban-config";

type KanbanColumnProps = {
    config: KanbanColumnConfig;
    topics: Topic[];
    /** Quantos cards desta coluna estão visíveis (o resto fica atrás de "Mostrar mais"). */
    visibleCount: number;
    /** Algum card está sendo arrastado: as colunas mostram onde dá para soltar. */
    isDragActive: boolean;
    /** Controles extras sob o título da coluna (ex.: a escolha de ordem). */
    headerExtra?: ReactNode;
    onShowMore: (status: TopicStatus) => void;
    onMove: (topic: Topic, to: TopicStatus) => void;
};

export function KanbanColumn({ config, topics, visibleCount, isDragActive, headerExtra, onShowMore, onMove }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: config.status });
    const Icon = config.icon;
    const visible = topics.slice(0, visibleCount);
    const hidden = topics.length - visible.length;
    const headingId = `kanban-col-${config.status}`;

    return (
        <section
            ref={setNodeRef}
            aria-labelledby={headingId}
            className={cn(
                "glass flex flex-col rounded-2xl outline-2 -outline-offset-2 outline-transparent transition-[outline-color] duration-150",
                isDragActive && "outline-dashed outline-foreground/15",
                isOver && cn("outline-solid", config.dropTone)
            )}
        >
            <header className="flex items-center gap-3 px-4 pt-4 pb-3">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", config.tone)}>
                    <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 id={headingId} className="text-base leading-tight font-semibold">
                        {config.title}
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">{config.hint}</p>
                </div>
                <span
                    className="rounded-full bg-foreground/8 px-2 py-0.5 text-xs font-medium tabular-nums"
                    aria-label={`${topics.length} ${topics.length === 1 ? "assunto" : "assuntos"}`}
                >
                    {topics.length}
                </span>
            </header>

            {headerExtra && <div className="px-4 pb-3">{headerExtra}</div>}

            <div className="flex min-h-48 max-h-[calc(100dvh-20rem)] flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-3 pb-3">
                {visible.length === 0 ? (
                    <p className="grid flex-1 place-items-center rounded-xl border border-dashed px-4 py-8 text-center text-sm text-balance text-muted-foreground">
                        {config.empty}
                    </p>
                ) : (
                    visible.map((topic) => <KanbanCard key={topic.id} topic={topic} onMove={onMove} />)
                )}

                {hidden > 0 && (
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => onShowMore(config.status)}>
                        Mostrar mais {Math.min(hidden, COLUMN_PAGE_SIZE)} (restam {hidden})
                    </Button>
                )}
            </div>
        </section>
    );
}

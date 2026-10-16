"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Topic, TopicStatus } from "@/types/topic";
import { useDraggable } from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KANBAN_COLUMNS } from "./kanban-config";
import { getOwnTitle, getReviewSummary, type ReviewTone } from "./kanban-utils";

const REVIEW_TONE: Record<ReviewTone, string> = {
    late: "text-destructive",
    today: "font-medium text-primary",
    upcoming: "text-muted-foreground",
    done: "text-emerald-700 dark:text-emerald-400",
};

type KanbanCardContentProps = {
    topic: Topic;
    /** Cópia que acompanha o ponteiro durante o arrasto: sem botões e levemente inclinada. */
    overlay?: boolean;
    onMove?: (topic: Topic, to: TopicStatus) => void;
    /** Abre o painel de detalhes do assunto (clique no card ou Enter no título). */
    onOpen?: (topic: Topic) => void;
};

/** Visual do card. Fica separado do arrastável para o DragOverlay desenhar a mesma coisa. */
export function KanbanCardContent({ topic, overlay = false, onMove, onOpen }: KanbanCardContentProps) {
    const columnIndex = KANBAN_COLUMNS.findIndex((column) => column.status === topic.status);
    const previous = columnIndex > 0 ? KANBAN_COLUMNS[columnIndex - 1] : null;
    const next = columnIndex >= 0 && columnIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[columnIndex + 1] : null;

    const title = getOwnTitle(topic);
    const context = topic.parentTitle ? `${topic.subject.title} › ${topic.parentTitle}` : topic.subject.title;
    const review = topic.status === "CONCLUIDO" ? getReviewSummary(topic) : null;

    return (
        <article
            onClick={!overlay && onOpen ? () => onOpen(topic) : undefined}
            className={cn(
                "relative rounded-xl bg-(--glass-fill-strong) py-2 pr-2 pl-4 text-sm ring-1 ring-(--glass-ring) shadow-[inset_0_1px_0_var(--glass-edge)]",
                overlay
                    ? "rotate-[1.5deg] cursor-grabbing bg-(--popover) ring-primary/60 shadow-[0_20px_44px_-14px_var(--glass-shadow)] backdrop-blur-md"
                    : "group/card cursor-grab transition-shadow hover:ring-primary/35"
            )}
        >
            {/* A cor da matéria vira a lateral do card, igual às outras telas. */}
            <span
                aria-hidden
                className="absolute inset-y-2.5 left-1.5 w-[3px] rounded-full"
                style={{ backgroundColor: topic.subject.color }}
            />

            <div className="flex min-h-6 items-center gap-1">
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={context}>
                    {context}
                </p>

                {!overlay && onMove && (
                    // O clique nos botões de mover não deve abrir o painel de detalhes.
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="flex shrink-0 items-center gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/card:opacity-100 [@media(hover:hover)]:group-hover/card:opacity-100"
                    >
                        {previous && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="[@media(pointer:coarse)]:size-8"
                                onClick={() => onMove(topic, previous.status)}
                                aria-label={`Mover “${title}” para ${previous.title}`}
                                title={`Mover para ${previous.title}`}
                            >
                                <ChevronLeft />
                            </Button>
                        )}
                        {next && (
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="[@media(pointer:coarse)]:size-8"
                                onClick={() => onMove(topic, next.status)}
                                aria-label={`Mover “${title}” para ${next.title}`}
                                title={`Mover para ${next.title}`}
                            >
                                <ChevronRight />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {!overlay && onOpen ? (
                // Botão de verdade: é por ele que teclado e leitor de tela abrem os detalhes (o card inteiro também é clicável).
                <button
                    type="button"
                    aria-label={`Ver detalhes de “${title}”`}
                    className="block w-full cursor-[inherit] rounded-sm pr-1 text-left text-sm leading-snug font-medium wrap-break-word outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                    {title}
                </button>
            ) : (
                <p className="pr-1 text-sm leading-snug font-medium wrap-break-word">{title}</p>
            )}

            {review && (
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <span aria-hidden className="flex shrink-0 gap-0.5">
                        {[0, 1, 2].map((index) => (
                            <span
                                key={index}
                                className={cn("size-1.5 rounded-full", index < review.done ? "bg-emerald-500" : "bg-foreground/20")}
                            />
                        ))}
                    </span>
                    <span className={REVIEW_TONE[review.tone]}>{review.text}</span>
                </div>
            )}
        </article>
    );
}

type KanbanCardProps = {
    topic: Topic;
    onMove: (topic: Topic, to: TopicStatus) => void;
    onOpen: (topic: Topic) => void;
};

/**
 * Card arrastável. Os listeners ficam no card inteiro; o arrasto só começa depois de mover o mouse
 * alguns pixels (ou segurar o dedo), então os botões de mover continuam clicáveis.
 * Pelo teclado, a troca de coluna é feita com os botões de seta do próprio card.
 */
export function KanbanCard({ topic, onMove, onOpen }: KanbanCardProps) {
    const { setNodeRef, listeners, isDragging } = useDraggable({ id: topic.id });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            className={cn("touch-manipulation select-none [-webkit-touch-callout:none]", isDragging && "opacity-30")}
        >
            <KanbanCardContent topic={topic} onMove={onMove} onOpen={onOpen} />
        </div>
    );
}

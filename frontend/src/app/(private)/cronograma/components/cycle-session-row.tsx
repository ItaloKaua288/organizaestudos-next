"use client"

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CycleSession } from "@/types/cycle";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useCallback } from "react";
import { formatMinutes } from "./cycle-utils";
import { SessionMarker } from "./session-marker";

const STATUS_LABEL: Record<CycleSession["status"], string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    PULADA: "Pulada",
};

type CycleSessionRowProps = {
    session: CycleSession;
    /** Posição na lista (começa em 0). */
    index: number;
    isCurrent: boolean;
    /** Enquanto uma ação ou o salvamento da ordem está em andamento, ninguém é arrastado. */
    isBusy: boolean;
    onOpenDetail: (subject: CycleSession["subject"]) => void;
    /** Clique no nome de uma sessão de revisão (leva até a lista de revisões do dia). */
    onOpenReviews?: () => void;
    /** Quantidade de revisões de hoje (mostrada na sessão de revisão). */
    reviewCount?: number;
};

/**
 * Linha de uma sessão do ciclo. É, ao mesmo tempo, o item arrastado e o alvo onde outra sessão
 * pode ser solta. Só a alça inicia o arrasto, então o botão do nome continua clicável.
 */
export function CycleSessionRow({ session, index, isCurrent, isBusy, onOpenDetail, onOpenReviews, reviewCount }: CycleSessionRowProps) {
    const isReview = session.kind === "REVISAO";
    const { setNodeRef: setDragRef, setActivatorNodeRef, listeners, isDragging } = useDraggable({ id: session.id, disabled: isBusy });
    const { setNodeRef: setDropRef } = useDroppable({ id: session.id });
    const setRowRef = useCallback(
        (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        },
        [setDragRef, setDropRef]
    );

    return (
        <li
            ref={setRowRef}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-foreground/6",
                isCurrent && "bg-primary/8 ring-1 ring-primary/30",
                session.inactive && "opacity-50",
                // Linha arrastada = fantasma: espaço pontilhado do mesmo tamanho, mostrando onde ela vai ficar.
                isDragging && "bg-primary/10 outline-2 -outline-offset-2 outline-dashed outline-primary/60 ring-0 hover:bg-primary/10 [&>*]:invisible"
            )}
        >
            <span
                ref={setActivatorNodeRef}
                {...listeners}
                title="Segure e arraste para mudar a ordem"
                aria-label="Arrastar para reordenar"
                className={cn(
                    "flex shrink-0 touch-none select-none items-center text-muted-foreground transition-colors hover:text-foreground",
                    isBusy ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
                )}
            >
                <GripVertical size={16} />
            </span>
            <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{index + 1}</span>
            <SessionMarker session={session} />
            <button
                type="button"
                disabled={session.inactive}
                onClick={() => (isReview ? onOpenReviews?.() : onOpenDetail(session.subject))}
                title={isReview ? "Ver as revisões de hoje" : "Ver assunto a ser estudado"}
                className={cn(
                    "flex-1 truncate rounded-md text-left font-medium transition-colors enabled:cursor-pointer enabled:hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                    session.status === "CONCLUIDA" && "line-through text-muted-foreground"
                )}
            >
                {session.subject.title}
            </button>
            {isReview && reviewCount !== undefined && (
                <Badge variant="outline" className="shrink-0">{reviewCount} {reviewCount === 1 ? "revisão" : "revisões"}</Badge>
            )}
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(session.duration)}</span>
            {session.inactive ? (
                <Badge variant="outline">{session.removed ? "Removida" : "Desativada"}</Badge>
            ) : isCurrent ? (
                <Badge>{session.status === "EM_ANDAMENTO" ? "Em andamento" : "Atual"}</Badge>
            ) : (
                <Badge variant={session.status === "CONCLUIDA" ? "secondary" : "outline"}>
                    {STATUS_LABEL[session.status]}
                </Badge>
            )}
        </li>
    );
}

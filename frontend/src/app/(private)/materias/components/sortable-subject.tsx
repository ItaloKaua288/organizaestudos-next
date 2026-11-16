"use client";

import { BodyDragOverlay } from "@/lib/drag-kit";
import { Subject } from "@/types/subject";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { ReactNode, useCallback } from "react";

type SortableSubjectProps = {
    id: string;
    /** false = sem alça (busca/filtro/ordem automática ativos, ou salvando a nova ordem). */
    enabled: boolean;
    /** Recebe a alça de arrastar (ou null quando desativado) para posicionar onde quiser. */
    children: (handle: ReactNode) => ReactNode;
};

/**
 * Envolve o cartão de uma matéria: ele é o item arrastado e também o alvo onde outro cartão pode ser solto.
 * Só a alça inicia o arrasto, então links e botões do cartão seguem normais.
 */
export function SortableSubject({ id, enabled, children }: SortableSubjectProps) {
    const { setNodeRef: setDragRef, setActivatorNodeRef, listeners, isDragging } = useDraggable({ id, disabled: !enabled });
    const { setNodeRef: setDropRef } = useDroppable({ id, disabled: !enabled });

    const setRef = useCallback(
        (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        },
        [setDragRef, setDropRef]
    );

    const handle = enabled ? (
        <span
            ref={setActivatorNodeRef}
            {...listeners}
            role="button"
            title="Arraste para mudar a ordem"
            aria-label="Arrastar para reordenar a matéria"
            className="flex size-7 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-primary active:cursor-grabbing"
        >
            <GripVertical size={16} aria-hidden="true" />
        </span>
    ) : null;

    // grid-cols-1 = minmax(0,1fr) e min-w-0: sem isso a coluna cresce até a largura dos títulos longos
    // e as caixas do layout detalhado passam a se sobrepor.
    // Enquanto este cartão é o arrastado, ele vira o "fantasma": um espaço pontilhado do mesmo tamanho,
    // mostrando onde ele vai ficar ao soltar. O conteúdo some (invisible) mas mantém o tamanho.
    return (
        <div
            ref={setRef}
            className={`relative grid min-w-0 grid-cols-1 rounded-2xl transition-colors ${isDragging ? "bg-primary/10 outline-2 -outline-offset-2 outline-primary/60 outline-dashed" : ""}`}
        >
            <div className={isDragging ? "invisible grid min-w-0 grid-cols-1" : "contents"}>{children(handle)}</div>
        </div>
    );
}

/** Cópia flutuante que acompanha o ponteiro (um resumo pequeno: a caixa detalhada seria enorme). */
export function SubjectDragOverlay({ subject }: { subject: Subject | null }) {
    return (
        <BodyDragOverlay>
            {subject ? (
                <div className="glass-strong flex w-full max-w-xs rotate-[1.5deg] cursor-grabbing items-center gap-3 rounded-xl px-3 py-2 text-sm ring-1 ring-primary/60 shadow-[0_20px_44px_-14px_var(--glass-shadow)]">
                    <GripVertical size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
                    <span className="truncate font-medium">{subject.title}</span>
                </div>
            ) : null}
        </BodyDragOverlay>
    );
}

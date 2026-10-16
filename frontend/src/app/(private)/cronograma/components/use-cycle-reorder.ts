"use client";

import { rowCollisionDetection, useRowSensors } from "@/lib/drag-kit";
import { CycleSession } from "@/types/cycle";
import type { Announcements, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useId, useState } from "react";

/**
 * Arrastar para reordenar as sessões do ciclo, com @dnd-kit/core (a mesma biblioteca do Kanban).
 * O consumidor envolve a lista em `<DndContext {...dndProps}>` e cada linha usa useDraggable/useDroppable.
 * O hook só descobre "de qual posição para qual"; quem salva a nova ordem é o `onMove`.
 */
export function useCycleReorder(sessions: CycleSession[], onMove: (from: number, to: number) => void) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const dndId = useId();
    const sensors = useRowSensors();

    const activeSession = activeId ? sessions.find((session) => session.id === activeId) ?? null : null;

    const titleOf = (id: string | number) => sessions.find((session) => session.id === id)?.subject.title ?? "sessão";

    const announcements: Announcements = {
        onDragStart: ({ active }) => `Segurando a sessão ${titleOf(active.id)}.`,
        onDragOver: ({ active, over }) =>
            over && over.id !== active.id ? `Sobre a sessão ${titleOf(over.id)}.` : undefined,
        onDragEnd: ({ active, over }) =>
            over && over.id !== active.id
                ? `Sessão ${titleOf(active.id)} solta na posição de ${titleOf(over.id)}.`
                : `Sessão ${titleOf(active.id)} solta na posição original.`,
        onDragCancel: ({ active }) => `Movimento da sessão ${titleOf(active.id)} cancelado.`,
    };

    const dndProps = {
        id: dndId,
        sensors,
        collisionDetection: rowCollisionDetection,
        accessibility: { announcements },
        onDragStart: (event: DragStartEvent) => setActiveId(String(event.active.id)),
        onDragEnd: ({ active, over }: DragEndEvent) => {
            setActiveId(null);
            if (!over || over.id === active.id) return;

            const from = sessions.findIndex((session) => session.id === active.id);
            const to = sessions.findIndex((session) => session.id === over.id);
            if (from >= 0 && to >= 0) onMove(from, to);
        },
        onDragCancel: () => setActiveId(null),
    };

    return { activeSession, dndProps };
}

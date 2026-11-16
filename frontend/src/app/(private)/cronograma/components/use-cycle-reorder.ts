"use client";

import { rowCollisionDetection, useRowSensors } from "@/lib/drag-kit";
import { CycleSession } from "@/types/cycle";
import { MeasuringStrategy, type Announcements, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
import { useId, useMemo, useState } from "react";

/**
 * Arrastar para reordenar as sessões do ciclo, com @dnd-kit/core (a mesma biblioteca do Kanban).
 * O consumidor envolve a lista em `<DndContext {...dndProps}>` e cada linha usa useDraggable/useDroppable.
 * Durante o arrasto, `sessions` já vem na ordem de prévia: as linhas se reorganizam ao vivo e a linha
 * arrastada vira um espaço vazio (fantasma) onde vai cair. Cancelar (Esc) volta tudo.
 * O hook só descobre "de qual posição para qual"; quem salva a nova ordem é o `onMove`.
 */
export function useCycleReorder(sessions: CycleSession[], onMove: (from: number, to: number) => void) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [previewIds, setPreviewIds] = useState<string[] | null>(null);
    const dndId = useId();
    const sensors = useRowSensors();

    const viewSessions = useMemo(() => {
        if (!previewIds) return sessions;
        const byId = new Map(sessions.map((session) => [session.id, session]));
        return previewIds.map((id) => byId.get(id)).filter((session): session is CycleSession => !!session);
    }, [sessions, previewIds]);

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
        // As linhas mudam de lugar durante o arrasto: as posições precisam ser remedidas.
        measuring: { droppable: { strategy: MeasuringStrategy.Always } },
        accessibility: { announcements },
        onDragStart: (event: DragStartEvent) => {
            setActiveId(String(event.active.id));
            setPreviewIds(null);
        },
        onDragOver: ({ active, over }: DragOverEvent) => {
            if (!over || over.id === active.id) return;

            setPreviewIds((current) => {
                const ids = current ?? sessions.map((session) => session.id);
                const from = ids.indexOf(String(active.id));
                const to = ids.indexOf(String(over.id));
                if (from < 0 || to < 0 || from === to) return current;

                const next = [...ids];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                return next;
            });
        },
        // Soltar confirma a posição mostrada pelo fantasma.
        onDragEnd: ({ active }: { active: { id: string | number } }) => {
            const ids = previewIds;
            setActiveId(null);
            setPreviewIds(null);
            if (!ids) return;

            const from = sessions.findIndex((session) => session.id === active.id);
            const to = ids.indexOf(String(active.id));
            if (from >= 0 && to >= 0 && from !== to) onMove(from, to);
        },
        onDragCancel: () => {
            setActiveId(null);
            setPreviewIds(null);
        },
    };

    return { activeSession, sessions: viewSessions, dndProps };
}

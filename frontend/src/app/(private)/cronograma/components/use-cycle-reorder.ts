"use client";

import { CycleSession } from "@/types/cycle";
import { PointerEvent, useCallback, useEffect, useRef, useState } from "react";

export type CycleDragProps = {
    rowProps: {
        "data-cycle-row": string;
        "data-session-id": string;
    };
    handleProps: {
        onPointerDown: (e: PointerEvent<HTMLElement>) => void;
        onPointerMove: (e: PointerEvent<HTMLElement>) => void;
        onPointerUp: (e: PointerEvent<HTMLElement>) => void;
        onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
    };
};

export type CycleDragGhostData = {
    session: CycleSession;
    width: number;
    left: number;
    top: number;
};

const SCROLL_EDGE = 80;
const SCROLL_SPEED = 14;

/**
 * Arrastar para reordenar as sessões do ciclo (mesmo comportamento dos assuntos da página de matérias):
 * Pointer Events, funciona com mouse e toque, com cópia flutuante e rolagem automática nas bordas.
 * O hook só descobre "de qual posição para qual"; quem salva a nova ordem é o `onMove`.
 */
export function useCycleReorder(
    sessions: CycleSession[],
    onMove: (from: number, to: number) => void,
    disabled: boolean
) {
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [ghost, setGhost] = useState<CycleDragGhostData | null>(null);
    const ghostRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{
        id: string;
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
        overId: string | null;
    } | null>(null);

    const positionGhost = () => {
        const drag = dragRef.current;
        const element = ghostRef.current;
        if (!drag || !element) return;

        element.style.transform = `translate3d(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px, 0) scale(1.02)`;
    };

    const updateOver = useCallback(() => {
        const drag = dragRef.current;
        if (!drag) return;

        const element = document.elementFromPoint(drag.x, drag.y);
        const row = element?.closest<HTMLElement>("[data-cycle-row]");
        const target = row?.dataset.sessionId ?? null;

        if (drag.overId !== target) {
            drag.overId = target;
            setOverId(target);
        }
    }, []);

    useEffect(() => {
        if (!draggedId) return;

        const previousUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none";

        const interval = window.setInterval(() => {
            const drag = dragRef.current;
            if (!drag) return;

            if (drag.y < SCROLL_EDGE) window.scrollBy(0, -SCROLL_SPEED);
            else if (drag.y > window.innerHeight - SCROLL_EDGE) window.scrollBy(0, SCROLL_SPEED);

            updateOver();
        }, 16);

        return () => {
            window.clearInterval(interval);
            document.body.style.userSelect = previousUserSelect;
        };
    }, [draggedId, updateOver]);

    const finishDrag = (drop: boolean) => {
        const drag = dragRef.current;
        dragRef.current = null;
        setDraggedId(null);
        setOverId(null);
        setGhost(null);

        if (!drop || !drag || !drag.overId || drag.overId === drag.id) return;

        const from = sessions.findIndex((s) => s.id === drag.id);
        const to = sessions.findIndex((s) => s.id === drag.overId);
        if (from >= 0 && to >= 0) onMove(from, to);
    };

    const getDragProps = (sessionId: string): CycleDragProps => ({
        rowProps: {
            "data-cycle-row": "",
            "data-session-id": sessionId,
        },
        handleProps: {
            onPointerDown: (e) => {
                if (disabled) return;
                if (e.pointerType === "mouse" && e.button !== 0) return;

                const session = sessions.find((s) => s.id === sessionId);
                const rect = e.currentTarget.closest<HTMLElement>("[data-cycle-row]")?.getBoundingClientRect();
                if (!session || !rect) return;

                e.currentTarget.setPointerCapture(e.pointerId);
                dragRef.current = {
                    id: sessionId,
                    x: e.clientX,
                    y: e.clientY,
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                    overId: sessionId,
                };
                setDraggedId(sessionId);
                setOverId(sessionId);
                setGhost({ session, width: rect.width, left: rect.left, top: rect.top });
            },
            onPointerMove: (e) => {
                const drag = dragRef.current;
                if (!drag || drag.id !== sessionId) return;

                drag.x = e.clientX;
                drag.y = e.clientY;
                positionGhost();
                updateOver();
            },
            onPointerUp: (e) => {
                if (dragRef.current?.id !== sessionId) return;
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                finishDrag(true);
            },
            onPointerCancel: () => {
                if (dragRef.current?.id !== sessionId) return;
                finishDrag(false);
            },
        },
    });

    return { draggedId, overId, ghost, ghostRef, getDragProps };
}

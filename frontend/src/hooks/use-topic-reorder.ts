"use client";

import { reorderTopicsAction } from "@/actions/topics.actions";
import { Topic } from "@/types/topic";
import { PointerEvent, useCallback, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";

export type MoveDirection = "up" | "down";

export type TopicDragProps = {
    /** Atributos da linha (usados para descobrir qual linha está sob o dedo/mouse). */
    rowProps: {
        "data-topic-row": string;
        "data-topic-id": string;
        "data-subject-id": string;
    };
    /** Eventos do ícone de arrastar (funcionam com mouse e com toque). */
    handleProps: {
        onPointerDown: (e: PointerEvent<HTMLElement>) => void;
        onPointerMove: (e: PointerEvent<HTMLElement>) => void;
        onPointerUp: (e: PointerEvent<HTMLElement>) => void;
        onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
    };
};

/** Dados da "cópia flutuante" que acompanha o ponteiro durante o arrasto. */
export type TopicDragGhostData = {
    topic: Topic;
    width: number;
    /** Posição inicial (px, relativa à janela). Depois disso o hook move o elemento direto pelo DOM. */
    left: number;
    top: number;
};

const SCROLL_EDGE = 80; // px da borda da tela onde a página começa a rolar
const SCROLL_SPEED = 14; // px por "tick"

/**
 * Controla a troca de posição dos assuntos de UMA matéria (setas e arrastar).
 * O arrastar usa Pointer Events (mouse + toque), sem biblioteca externa.
 * A lista é atualizada na tela na hora (otimista) e o servidor é chamado em seguida;
 * se a chamada falhar, a ordem anterior volta sozinha.
 */
export function useTopicReorder(subjectId: string, topics: Topic[]) {
    const [isPending, startTransition] = useTransition();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [ghost, setGhost] = useState<TopicDragGhostData | null>(null);
    const ghostRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{
        id: string;
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
        overId: string | null;
    } | null>(null);

    const sortedTopics = useMemo(
        () => [...topics].sort((a, b) => a.order - b.order),
        [topics]
    );

    const [optimisticTopics, setOptimisticTopics] = useOptimistic(
        sortedTopics,
        (_current: Topic[], next: Topic[]) => next
    );

    // Tira o assunto da posição "from" e o coloca na posição "to".
    const moveByIndex = (from: number, to: number) => {
        if (isPending) return;
        if (from < 0 || to < 0 || from >= optimisticTopics.length || to >= optimisticTopics.length || from === to) return;

        const next = [...optimisticTopics];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);

        // Renumera tudo (0..n-1): evita problemas com ordens repetidas ou com "buracos".
        const reindexed = next.map((topic, order) => ({ ...topic, order }));

        startTransition(async () => {
            setOptimisticTopics(reindexed);

            try {
                const result = await reorderTopicsAction(subjectId, reindexed.map((topic) => topic.id));

                if (!result.success) toast.error(result.message, { id: "reorder-topics" });
            } catch (error) {
                console.error("Falha ao reordenar os assuntos", error);
                toast.error("Falha ao reordenar os assuntos", { id: "reorder-topics" });
            }
        });
    };

    const moveTopic = (topicId: string, direction: MoveDirection) => {
        const index = optimisticTopics.findIndex((topic) => topic.id === topicId);
        moveByIndex(index, direction === "up" ? index - 1 : index + 1);
    };

    // Move a cópia flutuante para a posição do ponteiro (direto no DOM, sem re-render).
    const positionGhost = () => {
        const drag = dragRef.current;
        const element = ghostRef.current;
        if (!drag || !element) return;

        element.style.transform = `translate3d(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px, 0) scale(1.02)`;
    };

    // Descobre qual linha (desta matéria) está sob o ponteiro.
    const updateOver = useCallback(() => {
        const drag = dragRef.current;
        if (!drag) return;

        const element = document.elementFromPoint(drag.x, drag.y);
        const row = element?.closest<HTMLElement>("[data-topic-row]");
        const target = row && row.dataset.subjectId === subjectId ? row.dataset.topicId ?? null : null;

        if (drag.overId !== target) {
            drag.overId = target;
            setOverId(target);
        }
    }, [subjectId]);

    // Enquanto arrasta: rola a página perto das bordas e impede a seleção de texto.
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

        if (!drop || !drag || !drag.overId) return;

        const from = optimisticTopics.findIndex((topic) => topic.id === drag.id);
        const to = optimisticTopics.findIndex((topic) => topic.id === drag.overId);
        moveByIndex(from, to);
    };

    const getDragProps = (topicId: string): TopicDragProps => ({
        rowProps: {
            "data-topic-row": "",
            "data-topic-id": topicId,
            "data-subject-id": subjectId,
        },
        handleProps: {
            onPointerDown: (e) => {
                if (isPending) return;
                // Só o botão principal do mouse (ou o toque/caneta).
                if (e.pointerType === "mouse" && e.button !== 0) return;

                const topic = optimisticTopics.find((item) => item.id === topicId);
                const rect = e.currentTarget.closest<HTMLElement>("[data-topic-row]")?.getBoundingClientRect();
                if (!topic || !rect) return;

                e.currentTarget.setPointerCapture(e.pointerId);
                dragRef.current = {
                    id: topicId,
                    x: e.clientX,
                    y: e.clientY,
                    // Mantém o ponto onde você segurou: a cópia não "pula" para o cursor.
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                    overId: topicId,
                };
                setDraggedId(topicId);
                setOverId(topicId);
                setGhost({ topic, width: rect.width, left: rect.left, top: rect.top });
            },
            onPointerMove: (e) => {
                const drag = dragRef.current;
                if (!drag || drag.id !== topicId) return;

                drag.x = e.clientX;
                drag.y = e.clientY;
                positionGhost();
                updateOver();
            },
            onPointerUp: (e) => {
                if (dragRef.current?.id !== topicId) return;
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                finishDrag(true);
            },
            onPointerCancel: () => {
                if (dragRef.current?.id !== topicId) return;
                finishDrag(false);
            },
        },
    });

    return {
        topics: optimisticTopics,
        moveTopic,
        isReordering: isPending,
        draggedId,
        overId,
        ghost,
        ghostRef,
        getDragProps,
    };
}

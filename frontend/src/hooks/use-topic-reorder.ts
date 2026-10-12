"use client";

import { reorderTopicsAction } from "@/actions/topics.actions";
import { Topic } from "@/types/topic";
import { DragEvent, useMemo, useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";

export type MoveDirection = "up" | "down";

export type TopicDragProps = {
    onDragStart: (e: DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
};

/**
 * Controla a troca de posição dos assuntos de UMA matéria (setas e arrastar com o mouse).
 * A lista é atualizada na tela na hora (otimista) e o servidor é chamado em seguida;
 * se a chamada falhar, a ordem anterior volta sozinha.
 */
export function useTopicReorder(subjectId: string, topics: Topic[]) {
    const [isPending, startTransition] = useTransition();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

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

    const clearDrag = () => {
        setDraggedId(null);
        setOverId(null);
    };

    const getDragProps = (topicId: string): TopicDragProps => ({
        onDragStart: (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", topicId);
            setDraggedId(topicId);
        },
        onDragOver: (e) => {
            // Só aceita soltar se o item arrastado for desta mesma matéria.
            if (!draggedId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overId !== topicId) setOverId(topicId);
        },
        onDrop: (e) => {
            if (!draggedId) return;
            e.preventDefault();

            const from = optimisticTopics.findIndex((topic) => topic.id === draggedId);
            const to = optimisticTopics.findIndex((topic) => topic.id === topicId);

            clearDrag();
            moveByIndex(from, to);
        },
        onDragEnd: clearDrag,
    });

    return {
        topics: optimisticTopics,
        moveTopic,
        isReordering: isPending,
        draggedId,
        overId,
        getDragProps,
    };
}

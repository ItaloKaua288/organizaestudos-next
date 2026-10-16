"use client";

import { reorderTopicsAction } from "@/actions/topics.actions";
import { rowCollisionDetection, useRowSensors } from "@/lib/drag-kit";
import { sortTopicsHierarchically } from "@/lib/topic-tree";
import { Topic } from "@/types/topic";
import type { Announcements, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useCallback, useId, useMemo, useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";

export type MoveDirection = "up" | "down";

export type TopicDragProps = {
    /** Nenhuma linha pode ser arrastada enquanto a nova ordem está sendo salva. */
    disabled: boolean;
    /** true quando há um arrasto em andamento e esta linha não é irmã da linha arrastada. */
    dropDisabled: boolean;
};

/** Informações de posição de um assunto dentro do grupo de irmãos dele. */
export type TopicMeta = {
    isFirst: boolean;
    isLast: boolean;
    isSubtopic: boolean;
    childCount: number;
};

/**
 * Controla a troca de posição dos assuntos de UMA matéria (setas e arrastar).
 * Assuntos principais só trocam de lugar com assuntos principais, e subassuntos só trocam
 * com os outros subassuntos do mesmo pai. A lista devolvida já vem com cada subassunto após o pai.
 * O arrastar usa @dnd-kit/core (a mesma biblioteca do Kanban): o consumidor envolve a lista em
 * `<DndContext {...dndProps}>` e cada linha usa `getDragProps` no `TopicRow`.
 * A lista é atualizada na tela na hora (otimista) e o servidor é chamado em seguida;
 * se a chamada falhar, a ordem anterior volta sozinha.
 */
export function useTopicReorder(subjectId: string, topics: Topic[]) {
    const [isPending, startTransition] = useTransition();
    const [activeId, setActiveId] = useState<string | null>(null);
    const dndId = useId();
    const sensors = useRowSensors();

    const sortedTopics = useMemo(() => sortTopicsHierarchically(topics), [topics]);

    const [optimisticTopics, setOptimisticTopics] = useOptimistic(
        sortedTopics,
        (_current: Topic[], next: Topic[]) => next
    );

    const topicIds = useMemo(() => new Set(optimisticTopics.map((topic) => topic.id)), [optimisticTopics]);

    // Grupo de irmãos: id do pai (quando ele está na lista) ou "" para assuntos principais.
    const groupOf = useCallback(
        (topic: Topic) => (topic.parentId && topicIds.has(topic.parentId) ? topic.parentId : ""),
        [topicIds]
    );

    const getSiblings = (topic: Topic) => {
        const group = groupOf(topic);
        return optimisticTopics.filter((item) => groupOf(item) === group);
    };

    // Tira o assunto "fromId" do lugar e o coloca no lugar do "toId" (os dois precisam ser irmãos).
    const moveBefore = (fromId: string, toId: string) => {
        if (isPending || fromId === toId) return;

        const from = optimisticTopics.find((topic) => topic.id === fromId);
        const to = optimisticTopics.find((topic) => topic.id === toId);
        if (!from || !to || groupOf(from) !== groupOf(to)) return;

        const siblings = getSiblings(from);
        const fromIndex = siblings.findIndex((topic) => topic.id === fromId);
        const toIndex = siblings.findIndex((topic) => topic.id === toId);
        if (fromIndex < 0 || toIndex < 0) return;

        const nextSiblings = [...siblings];
        const [moved] = nextSiblings.splice(fromIndex, 1);
        nextSiblings.splice(toIndex, 0, moved);

        // Renumera só os irmãos (0..n-1): evita problemas com ordens repetidas ou com "buracos".
        const reindexed = nextSiblings.map((topic, order) => ({ ...topic, order }));
        const reindexedById = new Map(reindexed.map((topic) => [topic.id, topic]));
        const next = sortTopicsHierarchically(optimisticTopics.map((topic) => reindexedById.get(topic.id) ?? topic));

        startTransition(async () => {
            setOptimisticTopics(next);

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
        const topic = optimisticTopics.find((item) => item.id === topicId);
        if (!topic) return;

        const siblings = getSiblings(topic);
        const index = siblings.findIndex((item) => item.id === topicId);
        const target = siblings[direction === "up" ? index - 1 : index + 1];

        if (target) moveBefore(topicId, target.id);
    };

    const getTopicMeta = (topicId: string): TopicMeta => {
        const topic = optimisticTopics.find((item) => item.id === topicId);
        if (!topic) return { isFirst: true, isLast: true, isSubtopic: false, childCount: 0 };

        const siblings = getSiblings(topic);
        const index = siblings.findIndex((item) => item.id === topicId);

        return {
            isFirst: index === 0,
            isLast: index === siblings.length - 1,
            isSubtopic: groupOf(topic) !== "",
            childCount: optimisticTopics.filter((item) => groupOf(item) === topicId).length,
        };
    };

    const activeTopic = activeId ? optimisticTopics.find((topic) => topic.id === activeId) ?? null : null;
    const activeGroup = activeTopic ? groupOf(activeTopic) : null;

    // Só dá para soltar entre irmãos: durante o arrasto, as outras linhas deixam de ser alvo.
    const getDragProps = (topicId: string): TopicDragProps => {
        const topic = optimisticTopics.find((item) => item.id === topicId);

        return {
            disabled: isPending,
            dropDisabled: activeGroup !== null && (!topic || groupOf(topic) !== activeGroup),
        };
    };

    const titleOf = (id: string | number) => optimisticTopics.find((topic) => topic.id === id)?.title ?? "assunto";

    const announcements: Announcements = {
        onDragStart: ({ active }) => `Segurando ${titleOf(active.id)}.`,
        onDragOver: ({ active, over }) =>
            over && over.id !== active.id ? `${titleOf(active.id)} sobre ${titleOf(over.id)}.` : undefined,
        onDragEnd: ({ active, over }) =>
            over && over.id !== active.id
                ? `${titleOf(active.id)} solto na posição de ${titleOf(over.id)}.`
                : `${titleOf(active.id)} solto na posição original.`,
        onDragCancel: ({ active }) => `Movimento de ${titleOf(active.id)} cancelado.`,
    };

    const dndProps = {
        id: dndId,
        sensors,
        collisionDetection: rowCollisionDetection,
        accessibility: { announcements },
        onDragStart: (event: DragStartEvent) => setActiveId(String(event.active.id)),
        onDragEnd: ({ active, over }: DragEndEvent) => {
            setActiveId(null);
            if (over) moveBefore(String(active.id), String(over.id));
        },
        onDragCancel: () => setActiveId(null),
    };

    return {
        topics: optimisticTopics,
        moveTopic,
        getTopicMeta,
        isReordering: isPending,
        activeTopic,
        dndProps,
        getDragProps,
    };
}

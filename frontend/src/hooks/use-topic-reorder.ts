"use client";

import { reorderTopicsAction } from "@/actions/topics.actions";
import { rowCollisionDetection, useRowSensors } from "@/lib/drag-kit";
import { sortTopicsHierarchically } from "@/lib/topic-tree";
import { Topic } from "@/types/topic";
import { MeasuringStrategy, type Announcements, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
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
 * Durante o arrasto, `topics` já vem na ordem de prévia: o assunto arrastado vira um espaço vazio (fantasma)
 * na posição onde vai cair e os irmãos se reorganizam ao vivo. Soltar confirma; cancelar (Esc) volta.
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

    // Ordem de prévia enquanto arrasta (null = sem arrasto ou nada mudou ainda).
    const [previewTopics, setPreviewTopics] = useState<Topic[] | null>(null);
    const viewTopics = previewTopics ?? optimisticTopics;

    const topicIds = useMemo(() => new Set(optimisticTopics.map((topic) => topic.id)), [optimisticTopics]);

    // Grupo de irmãos: id do pai (quando ele está na lista) ou "" para assuntos principais.
    const groupOf = useCallback(
        (topic: Topic) => (topic.parentId && topicIds.has(topic.parentId) ? topic.parentId : ""),
        [topicIds]
    );

    const getSiblings = (topic: Topic, list: Topic[] = viewTopics) => {
        const group = groupOf(topic);
        return list.filter((item) => groupOf(item) === group);
    };

    // Tira o assunto "fromId" do lugar e o coloca no lugar do "toId" (os dois precisam ser irmãos).
    // Devolve a lista inteira já reordenada (subassuntos após o pai) e os ids dos irmãos na nova ordem.
    const computeMove = (list: Topic[], fromId: string, toId: string) => {
        if (fromId === toId) return null;

        const from = list.find((topic) => topic.id === fromId);
        const to = list.find((topic) => topic.id === toId);
        if (!from || !to || groupOf(from) !== groupOf(to)) return null;

        const siblings = getSiblings(from, list);
        const fromIndex = siblings.findIndex((topic) => topic.id === fromId);
        const toIndex = siblings.findIndex((topic) => topic.id === toId);
        if (fromIndex < 0 || toIndex < 0) return null;

        const nextSiblings = [...siblings];
        const [moved] = nextSiblings.splice(fromIndex, 1);
        nextSiblings.splice(toIndex, 0, moved);

        // Renumera só os irmãos (0..n-1): evita problemas com ordens repetidas ou com "buracos".
        const reindexed = nextSiblings.map((topic, order) => ({ ...topic, order }));
        const reindexedById = new Map(reindexed.map((topic) => [topic.id, topic]));
        const next = sortTopicsHierarchically(list.map((topic) => reindexedById.get(topic.id) ?? topic));

        return { next, orderedIds: reindexed.map((topic) => topic.id) };
    };

    // Salva a nova ordem: atualiza a tela na hora e chama o servidor.
    const commitOrder = (next: Topic[], orderedIds: string[]) => {
        startTransition(async () => {
            setOptimisticTopics(next);

            try {
                const result = await reorderTopicsAction(subjectId, orderedIds);

                if (!result.success) toast.error(result.message, { id: "reorder-topics" });
            } catch (error) {
                console.error("Falha ao reordenar os assuntos", error);
                toast.error("Falha ao reordenar os assuntos", { id: "reorder-topics" });
            }
        });
    };

    // Setas: troca de lugar com o irmão ao lado.
    const moveBefore = (fromId: string, toId: string) => {
        if (isPending) return;

        const result = computeMove(optimisticTopics, fromId, toId);
        if (result) commitOrder(result.next, result.orderedIds);
    };

    const moveTopic = (topicId: string, direction: MoveDirection) => {
        const topic = viewTopics.find((item) => item.id === topicId);
        if (!topic) return;

        const siblings = getSiblings(topic);
        const index = siblings.findIndex((item) => item.id === topicId);
        const target = siblings[direction === "up" ? index - 1 : index + 1];

        if (target) moveBefore(topicId, target.id);
    };

    const getTopicMeta = (topicId: string): TopicMeta => {
        const topic = viewTopics.find((item) => item.id === topicId);
        if (!topic) return { isFirst: true, isLast: true, isSubtopic: false, childCount: 0 };

        const siblings = getSiblings(topic);
        const index = siblings.findIndex((item) => item.id === topicId);

        return {
            isFirst: index === 0,
            isLast: index === siblings.length - 1,
            isSubtopic: groupOf(topic) !== "",
            childCount: viewTopics.filter((item) => groupOf(item) === topicId).length,
        };
    };

    const activeTopic = activeId ? viewTopics.find((topic) => topic.id === activeId) ?? null : null;
    const activeGroup = activeTopic ? groupOf(activeTopic) : null;

    // Só dá para soltar entre irmãos: durante o arrasto, as outras linhas deixam de ser alvo.
    const getDragProps = (topicId: string): TopicDragProps => {
        const topic = viewTopics.find((item) => item.id === topicId);

        return {
            disabled: isPending,
            dropDisabled: activeGroup !== null && (!topic || groupOf(topic) !== activeGroup),
        };
    };

    const titleOf = (id: string | number) => viewTopics.find((topic) => topic.id === id)?.title ?? "assunto";

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
        // As linhas mudam de lugar durante o arrasto: as posições precisam ser remedidas.
        measuring: { droppable: { strategy: MeasuringStrategy.Always } },
        accessibility: { announcements },
        onDragStart: (event: DragStartEvent) => {
            setActiveId(String(event.active.id));
            setPreviewTopics(null);
        },
        // Ao passar sobre um irmão, a prévia coloca o assunto arrastado na posição dele.
        onDragOver: ({ active, over }: DragOverEvent) => {
            if (!over || over.id === active.id) return;

            setPreviewTopics((current) => computeMove(current ?? optimisticTopics, String(active.id), String(over.id))?.next ?? current);
        },
        // Soltar confirma a posição mostrada pelo fantasma.
        onDragEnd: ({ active }: { active: { id: string | number } }) => {
            const preview = previewTopics;
            setActiveId(null);
            setPreviewTopics(null);
            if (!preview || isPending) return;

            const moved = preview.find((topic) => topic.id === active.id);
            if (!moved) return;

            const orderedIds = getSiblings(moved, preview).map((topic) => topic.id);
            const originalIds = getSiblings(moved, optimisticTopics).map((topic) => topic.id);
            if (orderedIds.every((id, index) => id === originalIds[index])) return;

            commitOrder(preview, orderedIds);
        },
        onDragCancel: () => {
            setActiveId(null);
            setPreviewTopics(null);
        },
    };

    return {
        topics: viewTopics,
        moveTopic,
        getTopicMeta,
        isReordering: isPending,
        activeTopic,
        dndProps,
        getDragProps,
    };
}

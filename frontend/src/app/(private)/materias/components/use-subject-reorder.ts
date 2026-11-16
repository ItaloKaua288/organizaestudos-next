"use client";

import { reorderSubjectsAction } from "@/actions/subjects.actions";
import { rowCollisionDetection, useRowSensors } from "@/lib/drag-kit";
import { Subject } from "@/types/subject";
import { MeasuringStrategy, type Announcements, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
import { useId, useMemo, useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";

/**
 * Controla a ordem manual das matérias (arrastar os cartões).
 * `subjects` precisa vir na ordem manual (a que a API devolve). A lista muda na tela na hora
 * (otimista) e o servidor é chamado em seguida; se falhar, a ordem anterior volta sozinha.
 * Durante o arrasto, `subjects` já vem com a ordem "de prévia": os cartões se reorganizam ao vivo e o
 * cartão arrastado ocupa (como um espaço vazio) o lugar onde vai cair. Soltar confirma; cancelar (Esc) volta.
 * O consumidor envolve os cartões em `<DndContext {...dndProps}>`.
 */
export function useSubjectReorder<T extends Subject>(subjects: T[]) {
    const [isPending, startTransition] = useTransition();
    const [activeId, setActiveId] = useState<string | null>(null);
    const dndId = useId();
    const sensors = useRowSensors();

    const [optimisticSubjects, setOptimisticSubjects] = useOptimistic(
        subjects,
        (_current: T[], next: T[]) => next
    );

    // Ordem de prévia enquanto arrasta (null = sem arrasto ou nada mudou ainda).
    const [previewIds, setPreviewIds] = useState<string[] | null>(null);

    const viewSubjects = useMemo(() => {
        if (!previewIds) return optimisticSubjects;
        const byId = new Map(optimisticSubjects.map((subject) => [subject.id, subject]));
        return previewIds.map((id) => byId.get(id)).filter((subject): subject is T => !!subject);
    }, [optimisticSubjects, previewIds]);

    // Salva a ordem final (lista completa de ids).
    const commit = (ids: string[]) => {
        if (isPending) return;
        if (ids.every((id, index) => id === optimisticSubjects[index]?.id)) return;

        const byId = new Map(optimisticSubjects.map((subject) => [subject.id, subject]));
        const next = ids.map((id) => byId.get(id)).filter((subject): subject is T => !!subject);
        if (next.length !== optimisticSubjects.length) return;

        startTransition(async () => {
            setOptimisticSubjects(next);

            try {
                const result = await reorderSubjectsAction(ids);

                if (!result.success) toast.error(result.message, { id: "reorder-subjects" });
            } catch (error) {
                console.error("Falha ao reordenar as matérias", error);
                toast.error("Falha ao reordenar as matérias", { id: "reorder-subjects" });
            }
        });
    };

    const activeSubject = activeId ? viewSubjects.find((subject) => subject.id === activeId) ?? null : null;

    const titleOf = (id: string | number) => viewSubjects.find((subject) => subject.id === id)?.title ?? "matéria";

    const announcements: Announcements = {
        onDragStart: ({ active }) => `Segurando ${titleOf(active.id)}.`,
        onDragOver: ({ active, over }) =>
            over && over.id !== active.id ? `${titleOf(active.id)} sobre ${titleOf(over.id)}.` : undefined,
        onDragEnd: ({ active, over }) =>
            over && over.id !== active.id
                ? `${titleOf(active.id)} solta na posição de ${titleOf(over.id)}.`
                : `${titleOf(active.id)} solta na posição original.`,
        onDragCancel: ({ active }) => `Movimento de ${titleOf(active.id)} cancelado.`,
    };

    const dndProps = {
        id: dndId,
        sensors,
        collisionDetection: rowCollisionDetection,
        // Os cartões mudam de lugar durante o arrasto: as posições precisam ser remedidas.
        measuring: { droppable: { strategy: MeasuringStrategy.Always } },
        accessibility: { announcements },
        onDragStart: (event: DragStartEvent) => {
            setActiveId(String(event.active.id));
            setPreviewIds(null);
        },
        // Ao passar sobre outro cartão, a prévia coloca o arrastado na posição dele.
        onDragOver: ({ active, over }: DragOverEvent) => {
            if (!over || over.id === active.id) return;

            setPreviewIds((current) => {
                const ids = current ?? optimisticSubjects.map((subject) => subject.id);
                const from = ids.indexOf(String(active.id));
                const to = ids.indexOf(String(over.id));
                if (from < 0 || to < 0 || from === to) return current;

                const next = [...ids];
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                return next;
            });
        },
        // Soltar confirma a posição mostrada pelo espaço vazio (mesmo fora de qualquer cartão).
        onDragEnd: () => {
            const ids = previewIds;
            setActiveId(null);
            setPreviewIds(null);
            if (ids) commit(ids);
        },
        onDragCancel: () => {
            setActiveId(null);
            setPreviewIds(null);
        },
    };

    return {
        subjects: viewSubjects,
        isReordering: isPending,
        activeSubject,
        dndProps,
    };
}

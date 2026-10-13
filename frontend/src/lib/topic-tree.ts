/** Separador usado para mostrar "Assunto › Subassunto" fora da tela de matérias. */
export const TOPIC_TITLE_SEPARATOR = " › ";

type TreeNode = { id: string; parentId?: string | null; order: number };

/**
 * Coloca cada subassunto logo depois do assunto pai.
 * Assuntos principais ficam em ordem (order) e os subassuntos de cada um também.
 * Subassunto cujo pai não está na lista é tratado como assunto principal.
 */
export function sortTopicsHierarchically<T extends TreeNode>(topics: T[]): T[] {
    const ids = new Set(topics.map((topic) => topic.id));
    const byOrder = (a: T, b: T) => a.order - b.order;
    const hasParentInList = (topic: T) => !!topic.parentId && ids.has(topic.parentId);

    const roots = topics.filter((topic) => !hasParentInList(topic)).sort(byOrder);
    const childrenOf = new Map<string, T[]>();

    topics.filter(hasParentInList).forEach((topic) => {
        const key = topic.parentId as string;
        childrenOf.set(key, [...(childrenOf.get(key) ?? []), topic]);
    });

    return roots.flatMap((root) => [root, ...(childrenOf.get(root.id) ?? []).sort(byOrder)]);
}


type ContainerNode = {
    id: string;
    parentId?: string | null;
    status: "CONCLUIDO" | "PENDENTE";
    isContainer?: boolean;
    subtopicsTotal?: number;
    subtopicsDone?: number;
};

/**
 * Marca como "organizador" (isContainer) todo assunto que tem subassuntos e calcula quantos
 * subassuntos ele tem / quantos estão concluídos. Os demais itens passam sem alteração.
 */
export function markContainers<T extends ContainerNode>(topics: T[]): T[] {
    const ids = new Set(topics.map((topic) => topic.id));
    const stats = new Map<string, { total: number; done: number }>();

    topics.forEach((topic) => {
        if (!topic.parentId || !ids.has(topic.parentId)) return;

        const current = stats.get(topic.parentId) ?? { total: 0, done: 0 };
        current.total += 1;
        if (topic.status === "CONCLUIDO") current.done += 1;
        stats.set(topic.parentId, current);
    });

    return topics.map((topic) => {
        const info = stats.get(topic.id);
        if (!info) return topic;

        return { ...topic, isContainer: true, subtopicsTotal: info.total, subtopicsDone: info.done };
    });
}

/** Itens "de verdade" (que contam em progresso, revisões, cronograma etc.): tira os organizadores. */
export function withoutContainers<T extends { isContainer?: boolean }>(topics: T[]): T[] {
    return topics.filter((topic) => !topic.isContainer);
}

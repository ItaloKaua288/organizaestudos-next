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

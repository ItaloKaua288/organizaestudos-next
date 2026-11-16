"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Pastas (assuntos com subassuntos) recolhidas de uma matéria. Fica salvo neste navegador, por matéria,
 * para a lista abrir do jeito que foi deixada.
 */
export function useCollapsedFolders(subjectId: string) {
    const key = `oe:collapsed-folders:${subjectId}`;
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

    useEffect(() => {
        try {
            const raw = localStorage.getItem(key);
            const ids: unknown = raw ? JSON.parse(raw) : [];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCollapsed(new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []));
        } catch {
            // localStorage indisponível ou conteúdo inválido: segue com tudo aberto
        }
    }, [key]);

    const toggle = useCallback(
        (topicId: string) => {
            setCollapsed((prev) => {
                const next = new Set(prev);
                if (next.has(topicId)) next.delete(topicId);
                else next.add(topicId);
                try {
                    localStorage.setItem(key, JSON.stringify([...next]));
                } catch { }
                return next;
            });
        },
        [key]
    );

    const isCollapsed = useCallback((topicId: string) => collapsed.has(topicId), [collapsed]);

    return { isCollapsed, toggle };
}

"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { SearchResults } from "@/types/search";

const EMPTY: SearchResults = { query: "", subjects: [], topics: [], notes: [] };

/** Busca global em matérias, assuntos e notas. Nunca cacheia: o resultado depende do que o usuário digitou agora. */
export async function globalSearchAction(query: string): Promise<{ success: boolean; results: SearchResults; message?: string }> {
    try {
        const term = query.trim();
        if (term.length < 2) return { success: true, results: { ...EMPTY, query: term } };

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/search?q=${encodeURIComponent(term)}`, {
            headers,
            cache: "no-store",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, results: { ...EMPTY, query: term }, message: errorData.message || "Falha ao buscar." };
        }

        const data = await res.json();

        return {
            success: true,
            results: {
                query: data.query ?? term,
                subjects: data.subjects ?? [],
                topics: data.topics ?? [],
                notes: data.notes ?? [],
            },
        };
    } catch (error) {
        console.error("Erro interno na busca global:", error);
        return { success: false, results: { ...EMPTY, query }, message: "Ocorreu um erro inesperado ao buscar." };
    }
}

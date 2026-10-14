"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { ImportSummary } from "@/types/data";
import { revalidatePath } from "next/cache";

export type ExportFormat = "json" | "csv";

/** Gera o arquivo de exportação (matérias, assuntos e subassuntos). O download é feito no navegador. */
export async function exportDataAction(format: ExportFormat): Promise<{ success: boolean; message?: string; filename?: string; content?: string }> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/data/export?format=${format === "csv" ? "csv" : "json"}`, {
            headers,
            cache: "no-store",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao exportar os dados." };
        }

        const data = await res.json();
        return { success: true, filename: data.filename, content: data.content };
    } catch (error) {
        console.error("Erro interno ao exportar dados:", error);
        return { success: false, message: "Ocorreu um erro inesperado ao exportar." };
    }
}

/** Importa matérias e assuntos de um arquivo JSON ou CSV (o formato é detectado pelo conteúdo). */
export async function importDataAction(content: string): Promise<{ success: boolean; message: string; summary?: ImportSummary }> {
    try {
        if (!content || !content.trim()) return { success: false, message: "O arquivo está vazio." };

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/data/import`, {
            method: "POST",
            headers,
            body: JSON.stringify({ content }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao importar. O arquivo pode ser grande demais." };
        }

        const data = await res.json();

        revalidatePath("/");
        revalidatePath("/materias");
        revalidatePath("/notas");
        revalidatePath("/cronograma");
        revalidatePath("/desempenho");

        return { success: true, message: data.message ?? "Importação concluída.", summary: data.summary };
    } catch (error) {
        console.error("Erro interno ao importar dados:", error);
        return { success: false, message: "Ocorreu um erro inesperado ao importar." };
    }
}

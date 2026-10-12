"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { Cycle, CycleActionResult, CycleSessionInput } from "@/types/cycle";

async function cycleRequest(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown) {
    const baseUrl = await getBaseUrl();
    const headers = await getAuthHeaders();

    const res = await fetch(`${baseUrl}/cycle${path}`, {
        method,
        headers,
        cache: "no-store", // a posição do ciclo nunca pode vir de cache
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json().catch(() => ({}));
    return { res, data };
}

async function runCycleAction(
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body: unknown,
    fallbackMessage: string,
): Promise<CycleActionResult> {
    try {
        const { res, data } = await cycleRequest(method, path, body);

        if (!res.ok) {
            return {
                success: false,
                message: data.message || fallbackMessage,
                cycle: data.cycle ?? undefined,
                stale: Boolean(data.stale || data.conflict),
            };
        }

        return { success: true, message: data.message || "Ciclo atualizado!", cycle: data.cycle ?? null };
    } catch (error) {
        console.error("Erro interno no ciclo de estudos:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function getCycleAction(): Promise<Cycle | null> {
    try {
        const { res, data } = await cycleRequest("GET", "");

        if (!res.ok) throw new Error(data.message || "Falha ao buscar o ciclo na API.");

        return (data.cycle as Cycle | null) ?? null;
    } catch (error) {
        console.error("Erro interno ao buscar o ciclo:", error);
        throw new Error("Não foi possível carregar o ciclo de estudos. Tente novamente mais tarde.");
    }
}

export async function saveCycleAction(sessions: CycleSessionInput[]) {
    return runCycleAction("PUT", "", { sessions }, "Falha da API ao salvar o ciclo.");
}

export async function deleteCycleAction() {
    return runCycleAction("DELETE", "", undefined, "Falha da API ao excluir o ciclo.");
}

export async function startCycleSessionAction(sessionId: string, lap: number) {
    return runCycleAction("POST", "/sessions/start", { sessionId, lap }, "Falha ao iniciar a sessão.");
}

export async function completeCycleSessionAction(sessionId: string, lap: number) {
    return runCycleAction("POST", "/sessions/complete", { sessionId, lap }, "Falha ao concluir a sessão.");
}

export async function skipCycleSessionAction(sessionId: string, lap: number) {
    return runCycleAction("POST", "/sessions/skip", { sessionId, lap }, "Falha ao pular a sessão.");
}

export async function cancelCycleSessionAction(sessionId: string, lap: number) {
    return runCycleAction("POST", "/sessions/cancel", { sessionId, lap }, "Falha ao cancelar a sessão.");
}

export async function restartCycleLapAction() {
    return runCycleAction("POST", "/restart-lap", {}, "Falha ao reiniciar a volta.");
}

"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { CYCLE_COOKIE } from "@/lib/cycle-cookie";
import { Cycle, CycleActionResult, CycleProfileActionResult, CycleSessionInput, CyclesState } from "@/types/cycle";
import { QuestionEntryInput } from "@/types/question";
import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function setActiveCycleCookie(cycleId: string) {
    const cookieStore = await cookies();
    cookieStore.set(CYCLE_COOKIE, cycleId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: ONE_YEAR,
    });
}

async function clearActiveCycleCookie(onlyIfEquals?: string) {
    const cookieStore = await cookies();
    if (onlyIfEquals === undefined || cookieStore.get(CYCLE_COOKIE)?.value === onlyIfEquals) cookieStore.delete(CYCLE_COOKIE);
}

// Tudo que mostra o ciclo (cronograma, painel, kanban) precisa ser recarregado quando o ciclo ativo muda.
function revalidateCycleViews() {
    revalidatePath("/", "layout");
}

async function cycleRequest(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown, cycleId?: string) {
    const baseUrl = await getBaseUrl();
    const baseHeaders = await getAuthHeaders();
    const cookieStore = await cookies();
    // Ciclo ativo: o indicado explicitamente ou o do cookie (sem ele, a API usa o primeiro ciclo do perfil).
    const activeCycleId = cycleId ?? cookieStore.get(CYCLE_COOKIE)?.value;
    const headers = { ...baseHeaders, ...(activeCycleId ? { "x-cycle-id": activeCycleId } : {}) };

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

export async function saveCycleAction(sessions: CycleSessionInput[], sessionsPerDay?: number) {
    // sessionsPerDay ausente = mantém o valor salvo (usado ao reordenar).
    const result = await runCycleAction("PUT", "", { sessions, sessionsPerDay }, "Falha da API ao salvar o ciclo.");
    // Perfil sem ciclo: a API criou o primeiro e ele passa a ser o ativo.
    if (result.success && result.cycle) {
        await setActiveCycleCookie(result.cycle.id);
        revalidateCycleViews();
    }
    return result;
}

export async function deleteCycleAction() {
    const result = await runCycleAction("DELETE", "", undefined, "Falha da API ao excluir o ciclo.");
    if (result.success) {
        // O cookie apontava para o ciclo excluído: a API passa a usar o primeiro ciclo que sobrou (ou nenhum).
        await clearActiveCycleCookie();
        revalidateCycleViews();
        // Devolve o ciclo que ficou ativo para a tela já mostrar o próximo (ou o estado vazio).
        try {
            const { res, data } = await cycleRequest("GET", "");
            if (res.ok) return { ...result, cycle: (data.cycle as Cycle | null) ?? null };
        } catch { /* a tela se atualiza no próximo carregamento */ }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Perfis de ciclo: vários ciclos por perfil de estudo, com troca rápida entre eles.
// ---------------------------------------------------------------------------

export async function getCyclesAction(): Promise<CyclesState> {
    try {
        const { res, data } = await cycleRequest("GET", "/list");
        if (!res.ok) return { cycles: [], activeCycleId: null };
        return { cycles: data.cycles ?? [], activeCycleId: data.activeCycleId ?? null };
    } catch (error) {
        console.error("Erro interno ao buscar os ciclos:", error);
        return { cycles: [], activeCycleId: null };
    }
}

export async function switchCycleAction(cycleId: string): Promise<CycleProfileActionResult> {
    try {
        if (!cycleId) return { success: false, message: "Ciclo inválido." };

        // Confirma na API que o ciclo existe neste perfil antes de gravar o cookie.
        const { res, data } = await cycleRequest("GET", "", undefined, cycleId);
        const cycle = (data.cycle as Cycle | null) ?? null;

        if (!res.ok || !cycle || cycle.id !== cycleId) return { success: false, message: "Ciclo não encontrado." };

        await setActiveCycleCookie(cycleId);
        revalidateCycleViews();

        return { success: true, message: `Ciclo "${cycle.name}" ativo!`, cycle };
    } catch (error) {
        console.error("Erro interno ao trocar de ciclo:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function createCycleAction(name: string): Promise<CycleProfileActionResult> {
    try {
        const { res, data } = await cycleRequest("POST", "", { name: name.trim() });
        if (!res.ok) return { success: false, message: data.message || "Falha da API ao criar o ciclo." };

        // O ciclo recém-criado já vira o ciclo ativo.
        const cycle = data.cycle as Cycle;
        await setActiveCycleCookie(cycle.id);
        revalidateCycleViews();

        return { success: true, message: "Ciclo criado com sucesso!", cycle };
    } catch (error) {
        console.error("Erro interno ao criar ciclo:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function renameCycleAction(cycleId: string, name: string): Promise<CycleProfileActionResult> {
    try {
        const trimmed = name.trim();
        if (!trimmed) return { success: false, message: "O nome do ciclo é obrigatório." };

        const { res, data } = await cycleRequest("PUT", `/${cycleId}/rename`, { name: trimmed });
        if (!res.ok) return { success: false, message: data.message || "Falha da API ao renomear o ciclo." };

        revalidateCycleViews();
        return { success: true, message: "Ciclo renomeado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao renomear ciclo:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

/** Exclui um ciclo específico (e o histórico dele). Devolve o ciclo que ficou ativo (null = nenhum). */
export async function deleteCycleByIdAction(cycleId: string): Promise<CycleProfileActionResult> {
    try {
        const { res, data } = await cycleRequest("DELETE", `/${cycleId}`);
        if (!res.ok) return { success: false, message: data.message || "Falha da API ao excluir o ciclo." };

        await clearActiveCycleCookie(cycleId);
        revalidateCycleViews();

        const active = await cycleRequest("GET", "");
        return { success: true, message: "Ciclo excluído com sucesso.", cycle: active.res.ok ? ((active.data.cycle as Cycle | null) ?? null) : null };
    } catch (error) {
        console.error("Erro interno ao excluir ciclo:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function startCycleSessionAction(sessionId: string, lap: number) {
    return runCycleAction("POST", "/sessions/start", { sessionId, lap }, "Falha ao iniciar a sessão.");
}

/**
 * `questions` é opcional: questões feitas/acertadas por assunto, para o % de acerto.
 * `topicId` é opcional: assunto da sessão que será marcado como concluído (com as revisões agendadas).
 */
export async function completeCycleSessionAction(sessionId: string, lap: number, questions?: QuestionEntryInput[], topicId?: string) {
    const result = await runCycleAction(
        "POST",
        "/sessions/complete",
        {
            sessionId,
            lap,
            ...(questions && questions.length > 0 ? { questions } : {}),
            ...(topicId ? { topic_id: topicId } : {}),
        },
        "Falha ao concluir a sessão.",
    );

    if (result.success) {
        revalidatePath("/desempenho");

        if (topicId) {
            // O status do assunto mudou: expira o cache dos assuntos e atualiza as telas que dependem dele.
            updateTag("topics");
            revalidatePath("/cronograma");
            revalidatePath("/materias");
            revalidatePath("/materias/[id]", "page");
            revalidatePath("/kanban");
            revalidatePath("/revisoes");
            revalidatePath("/");
        }
    }

    return result;
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

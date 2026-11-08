"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { Deck, Flashcard, FlashcardBackupDeck, FlashcardRating } from "@/types/flashcard";
import { revalidatePath } from "next/cache";

type ActionResult = { success: boolean; message: string };

async function request(path: string, init: RequestInit = {}) {
    const baseUrl = await getBaseUrl();
    const headers = await getAuthHeaders();

    // Flashcards mudam a cada avaliação: nunca usar cache.
    return fetch(`${baseUrl}/flashcards${path}`, { ...init, headers, cache: "no-store" });
}

async function errorMessage(res: Response, fallback: string) {
    const data = await res.json().catch(() => ({}));
    return (data.message as string | undefined) || fallback;
}

// ---------------------------------------------------------------- Leitura

export async function getDecksAction(): Promise<Deck[]> {
    try {
        const res = await request("/decks");
        if (!res.ok) throw new Error(await errorMessage(res, "Falha ao buscar os baralhos na API."));

        const data = await res.json();
        return data.decks as Deck[];
    } catch (error) {
        console.error("Erro interno ao buscar os baralhos:", error);
        throw new Error("Não foi possível carregar os baralhos. Tente novamente mais tarde.");
    }
}

export async function getDeckAction(deckId: string): Promise<{ deck: Deck; cards: Flashcard[] } | null> {
    try {
        const res = await request(`/decks/${deckId}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await errorMessage(res, "Falha ao buscar o baralho na API."));

        const data = await res.json();
        return { deck: data.deck as Deck, cards: data.cards as Flashcard[] };
    } catch (error) {
        console.error("Erro interno ao buscar o baralho:", error);
        throw new Error("Não foi possível carregar o baralho. Tente novamente mais tarde.");
    }
}

export async function getStudyQueueAction(deckId: string): Promise<{
    deck: { id: string; name: string; color: string };
    cards: Flashcard[];
    learnAheadMinutes: number;
} | null> {
    try {
        const res = await request(`/decks/${deckId}/study`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(await errorMessage(res, "Falha ao montar a sessão de estudo."));

        const data = await res.json();
        return { deck: data.deck, cards: data.cards, learnAheadMinutes: data.learnAheadMinutes ?? 20 };
    } catch (error) {
        console.error("Erro interno ao montar a sessão de estudo:", error);
        throw new Error("Não foi possível carregar a sessão de estudo. Tente novamente mais tarde.");
    }
}

// ---------------------------------------------------------------- Baralhos

type DeckInput = { name: string; description?: string; color?: string };

export async function createDeckAction(input: DeckInput): Promise<ActionResult & { deck?: Deck }> {
    try {
        if (!input.name?.trim()) return { success: false, message: "O nome do baralho é obrigatório." };

        const res = await request("/decks", { method: "POST", body: JSON.stringify(input) });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao criar o baralho.") };

        const data = await res.json();
        revalidatePath("/flashcards");
        return { success: true, message: "Baralho criado!", deck: data.deck };
    } catch (error) {
        console.error("Erro interno ao criar baralho:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function updateDeckAction(deckId: string, input: DeckInput): Promise<ActionResult> {
    try {
        if (!input.name?.trim()) return { success: false, message: "O nome do baralho é obrigatório." };

        const res = await request(`/decks/${deckId}`, { method: "PUT", body: JSON.stringify(input) });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao atualizar o baralho.") };

        revalidatePath("/flashcards");
        revalidatePath(`/flashcards/${deckId}`);
        return { success: true, message: "Baralho atualizado!" };
    } catch (error) {
        console.error("Erro interno ao atualizar baralho:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function deleteDeckAction(deckId: string): Promise<ActionResult> {
    try {
        const res = await request(`/decks/${deckId}`, { method: "DELETE" });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao excluir o baralho.") };

        revalidatePath("/flashcards");
        return { success: true, message: "Baralho excluído." };
    } catch (error) {
        console.error("Erro interno ao excluir baralho:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

// ---------------------------------------------------------------- Cartões

type CardInput = { front: string; back: string };

export async function createCardsAction(deckId: string, cards: CardInput[]): Promise<ActionResult & { cards?: Flashcard[] }> {
    try {
        if (cards.length === 0) return { success: false, message: "Nenhum cartão para adicionar." };

        const res = await request(`/decks/${deckId}/cards`, { method: "POST", body: JSON.stringify({ cards }) });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao criar os cartões.") };

        const data = await res.json();
        revalidatePath("/flashcards");
        revalidatePath(`/flashcards/${deckId}`);
        return { success: true, message: data.message ?? "Cartão criado!", cards: data.cards };
    } catch (error) {
        console.error("Erro interno ao criar cartões:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function updateCardAction(deckId: string, cardId: string, input: CardInput): Promise<ActionResult> {
    try {
        const res = await request(`/cards/${cardId}`, { method: "PUT", body: JSON.stringify(input) });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao atualizar o cartão.") };

        revalidatePath(`/flashcards/${deckId}`);
        return { success: true, message: "Cartão atualizado!" };
    } catch (error) {
        console.error("Erro interno ao atualizar cartão:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function deleteCardAction(deckId: string, cardId: string): Promise<ActionResult> {
    try {
        const res = await request(`/cards/${cardId}`, { method: "DELETE" });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao excluir o cartão.") };

        revalidatePath("/flashcards");
        revalidatePath(`/flashcards/${deckId}`);
        return { success: true, message: "Cartão excluído." };
    } catch (error) {
        console.error("Erro interno ao excluir cartão:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function resetCardAction(deckId: string, cardId: string): Promise<ActionResult> {
    try {
        const res = await request(`/cards/${cardId}/reset`, { method: "POST" });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao reiniciar o cartão.") };

        revalidatePath("/flashcards");
        revalidatePath(`/flashcards/${deckId}`);
        return { success: true, message: "Cartão reiniciado." };
    } catch (error) {
        console.error("Erro interno ao reiniciar cartão:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

/** Registra a avaliação do cartão e devolve o cartão já reagendado (com os novos rótulos dos botões). */
export async function reviewCardAction(cardId: string, rating: FlashcardRating): Promise<ActionResult & { card?: Flashcard }> {
    try {
        const res = await request(`/cards/${cardId}/review`, { method: "POST", body: JSON.stringify({ rating }) });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao registrar a avaliação.") };

        const data = await res.json();
        // Sem revalidatePath: a sessão de estudo guarda o próprio estado; as telas de lista são dinâmicas.
        return { success: true, message: "", card: data.card };
    } catch (error) {
        console.error("Erro interno ao avaliar cartão:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

// ---------------------------------------------------------------- Exportar / importar

/** Todos os baralhos do perfil ativo, com cartões e progresso. */
export async function exportFlashcardsAction(): Promise<{ success: boolean; message: string; decks?: FlashcardBackupDeck[] }> {
    try {
        const res = await request("/export");
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao exportar.") };

        const data = await res.json();
        return { success: true, message: "", decks: data.decks as FlashcardBackupDeck[] };
    } catch (error) {
        console.error("Erro interno ao exportar flashcards:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

/** Cria baralhos novos (com cartões e progresso) a partir de um backup. */
export async function importFlashcardsAction(decks: FlashcardBackupDeck[]): Promise<ActionResult> {
    try {
        const res = await request("/import", { method: "POST", body: JSON.stringify({ decks }) });
        if (!res.ok) return { success: false, message: await errorMessage(res, "Falha da API ao importar.") };

        const data = await res.json();
        revalidatePath("/flashcards");
        return { success: true, message: data.message ?? "Importado!" };
    } catch (error) {
        console.error("Erro interno ao importar flashcards:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

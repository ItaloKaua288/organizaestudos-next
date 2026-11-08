export type FlashcardState = "new" | "learning" | "review" | "relearning";

/** Rótulos dos 4 botões: quanto tempo até o cartão voltar, para cada avaliação. */
export interface FlashcardPreviews {
    again: string;
    hard: string;
    good: string;
    easy: string;
}

export interface Flashcard {
    id: string;
    deckId: string;
    front: string;
    back: string;
    state: FlashcardState;
    /** Intervalo atual, em dias. */
    interval: number;
    /** Fator de facilidade (2.5 = 250%). */
    ease: number;
    due: string;
    reps: number;
    lapses: number;
    previews: FlashcardPreviews;
    createdAt?: string;
}

export interface DeckCounts {
    total: number;
    /** Novos disponíveis hoje (já respeita o limite diário). */
    new: number;
    /** Em aprendizado/reaprendizado e prontos para agora. */
    learning: number;
    /** Revisões vencidas até o fim do dia. */
    review: number;
}

export interface Deck {
    id: string;
    name: string;
    description: string;
    color: string;
    counts: DeckCounts;
    createdAt?: string;
}

/** Avaliação enviada ao servidor: 1 = Errei, 2 = Difícil, 3 = Bom, 4 = Fácil. */
export type FlashcardRating = 1 | 2 | 3 | 4;

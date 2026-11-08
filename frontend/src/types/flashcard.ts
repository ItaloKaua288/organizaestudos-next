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
    tags: string[];
    state: FlashcardState;
    step: number;
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

/** Ajustes de estudo de um baralho. Passos em minutos; intervalos em dias. */
export interface DeckSettings {
    newPerDay: number;
    reviewsPerDay: number;
    learningSteps: number[];
    relearningSteps: number[];
    graduatingInterval: number;
    easyInterval: number;
}

/** Mesmos valores padrão do servidor (backend/utils/srs.js). */
export const DEFAULT_DECK_SETTINGS: DeckSettings = {
    newPerDay: 20,
    reviewsPerDay: 200,
    learningSteps: [1, 10],
    relearningSteps: [10],
    graduatingInterval: 1,
    easyInterval: 4,
};

export interface Deck {
    id: string;
    name: string;
    description: string;
    color: string;
    settings: DeckSettings;
    counts: DeckCounts;
    createdAt?: string;
}

/** Avaliação enviada ao servidor: 1 = Errei, 2 = Difícil, 3 = Bom, 4 = Fácil. */
export type FlashcardRating = 1 | 2 | 3 | 4;

/** Formato do arquivo de backup (JSON). Um arquivo pode ter vários baralhos. */
export interface FlashcardBackupCard {
    front: string;
    back: string;
    tags?: string[];
    state?: FlashcardState;
    step?: number;
    interval?: number;
    ease?: number;
    due?: string;
    reps?: number;
    lapses?: number;
}

export interface FlashcardBackupDeck {
    name: string;
    description?: string;
    color?: string;
    settings?: DeckSettings;
    cards: FlashcardBackupCard[];
}

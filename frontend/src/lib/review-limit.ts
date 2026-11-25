import type { Topic } from "@/types/topic";

/**
 * Limite diário de revisões (lado do cliente). Espelha backend/utils/reviewLimit.js e serve só para
 * mostrar, antes de confirmar, em quantos dias a próxima revisão realmente vai cair.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SHIFT_DAYS = 366;

export type ReviewLoad = Record<string, number>;

type ReviewSlot = "first" | "second" | "third";
const SLOTS: ReviewSlot[] = ["first", "second", "third"];

const dayKey = (date: string | Date) => new Date(date).toISOString().slice(0, 10);

/** Hoje (AAAA-MM-DD) no horário de Brasília, independente do fuso do navegador. */
const todayKeyBR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

const addDaysToKey = (key: string, days: number) => new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

/** Quantas revisões pendentes existem em cada dia (AAAA-MM-DD → quantidade). */
export function buildReviewLoad(topics: Topic[]): ReviewLoad {
    const load: ReviewLoad = {};

    for (const topic of topics) {
        for (const slot of SLOTS) {
            const review = topic.reviews[slot];
            if (!review?.date || review.concluded) continue;

            const key = dayKey(review.date);
            load[key] = (load[key] ?? 0) + 1;
        }
    }

    return load;
}

/**
 * Em quantos dias (a partir de hoje) a revisão cai, respeitando o limite.
 * `skipSlots`: datas do próprio assunto que vão ser substituídas e por isso não contam.
 * Sem limite, devolve `idealDays`.
 */
export function placeReviewDays(params: {
    idealDays: number;
    limit: number | null;
    load: ReviewLoad;
    topic: Topic;
    skipSlots: ReviewSlot[];
}): number {
    const { idealDays, limit, load, topic, skipSlots } = params;
    if (!limit) return idealDays;

    const counts: ReviewLoad = { ...load };

    for (const slot of skipSlots) {
        const review = topic.reviews[slot];
        if (!review?.date || review.concluded) continue;

        const key = dayKey(review.date);
        counts[key] = Math.max(0, (counts[key] ?? 0) - 1);
    }

    const today = todayKeyBR();

    for (let offset = 0; offset <= MAX_SHIFT_DAYS; offset++) {
        const days = idealDays + offset;
        if ((counts[addDaysToKey(today, days)] ?? 0) < limit) return days;
    }

    return idealDays;
}

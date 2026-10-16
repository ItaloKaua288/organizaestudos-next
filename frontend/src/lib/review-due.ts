import { Topic } from "@/types/topic";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DueReview = {
    /** Qual revisão está pendente (1 = 24h, 2 = 7 dias, 3 = 30 dias). */
    number: 1 | 2 | 3;
    /** 0 = vence hoje; maior que 0 = dias de atraso. */
    overdueDays: number;
};

// Número do dia (calendário) de hoje no fuso de São Paulo.
export function todayDayNumberBR(): number {
    const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date()).split("-").map(Number);

    return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

// As datas de revisão são guardadas como a data de calendário (UTC) do dia da revisão.
export function reviewDayNumber(value: string | Date): number | null {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}

/**
 * Revisão que o assunto tem para fazer agora: a primeira revisão não concluída,
 * quando ela vence hoje ou já está atrasada. Retorna null se não há nada para hoje.
 */
export function getDueReview(topic: Topic): DueReview | null {
    if (topic.status !== "CONCLUIDO" || !topic.reviews) return null;

    const entries = [
        { number: 1 as const, review: topic.reviews.first },
        { number: 2 as const, review: topic.reviews.second },
        { number: 3 as const, review: topic.reviews.third },
    ];

    const current = entries.find(({ review }) => review && !review.concluded && review.date);
    if (!current) return null;

    const day = reviewDayNumber(current.review.date);
    if (day === null) return null;

    const overdueDays = todayDayNumberBR() - day;
    return overdueDays >= 0 ? { number: current.number, overdueDays } : null;
}

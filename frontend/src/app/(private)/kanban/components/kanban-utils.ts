import { reviewDayNumber, todayDayNumberBR } from "@/lib/review-due";
import { TOPIC_TITLE_SEPARATOR } from "@/lib/topic-tree";
import type { Topic } from "@/types/topic";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Título do assunto sem o prefixo "Assunto › " (o assunto pai aparece em outra linha do card). */
export function getOwnTitle(topic: Topic): string {
    const prefix = topic.parentTitle ? `${topic.parentTitle}${TOPIC_TITLE_SEPARATOR}` : "";
    return prefix && topic.title.startsWith(prefix) ? topic.title.slice(prefix.length) : topic.title;
}

export type ReviewTone = "late" | "today" | "upcoming" | "done";

export type ReviewSummary = {
    /** Quantas das 3 revisões já foram feitas. */
    done: number;
    /** Dias até a próxima revisão (negativo = atrasada). null = todas feitas ou sem data. */
    daysUntilNext: number | null;
    text: string;
    tone: ReviewTone;
};

/** Resume o andamento das revisões de um assunto concluído, para o card. */
export function getReviewSummary(topic: Topic): ReviewSummary {
    const entries = [topic.reviews?.first, topic.reviews?.second, topic.reviews?.third];
    const done = entries.filter((review) => review?.concluded).length;
    const nextIndex = entries.findIndex((review) => review && !review.concluded && review.date);

    if (done === 3) return { done, daysUntilNext: null, text: "Revisões completas", tone: "done" };
    if (nextIndex < 0) return { done, daysUntilNext: null, text: "Sem data de revisão", tone: "upcoming" };

    const day = reviewDayNumber(entries[nextIndex]!.date);
    if (day === null) return { done, daysUntilNext: null, text: "Sem data de revisão", tone: "upcoming" };

    const daysUntilNext = day - todayDayNumberBR();
    const label = `${nextIndex + 1}ª revisão`;

    if (daysUntilNext < 0) {
        const late = Math.abs(daysUntilNext);
        return { done, daysUntilNext, text: `${label} atrasada há ${late} ${late === 1 ? "dia" : "dias"}`, tone: "late" };
    }
    if (daysUntilNext === 0) return { done, daysUntilNext, text: `${label} hoje`, tone: "today" };
    if (daysUntilNext === 1) return { done, daysUntilNext, text: `${label} amanhã`, tone: "upcoming" };

    return { done, daysUntilNext, text: `${label} em ${daysUntilNext} dias`, tone: "upcoming" };
}

/** Datas (ISO) que a API vai gravar ao concluir um assunto: hoje + 1, 7 e 30 dias. Usado no update otimista. */
export function getScheduledReviews(): Topic["reviews"] {
    const today = todayDayNumberBR();
    const at = (days: number) => ({ date: new Date((today + days) * DAY_MS).toISOString(), concluded: false });

    return { first: at(1), second: at(7), third: at(30) };
}

export function getClearedReviews(): Topic["reviews"] {
    const empty = { date: "", concluded: false };
    return { first: { ...empty }, second: { ...empty }, third: { ...empty } };
}

/** Na coluna "Concluído", o que vence primeiro vem primeiro; quem já terminou as revisões vai para o fim. */
export function sortByReviewUrgency(topics: Topic[]): Topic[] {
    const keyOf = (topic: Topic) => getReviewSummary(topic).daysUntilNext ?? Number.POSITIVE_INFINITY;

    return topics
        .map((topic, index) => ({ topic, index, key: keyOf(topic) }))
        .sort((a, b) => (a.key === b.key ? a.index - b.index : a.key < b.key ? -1 : 1))
        .map(({ topic }) => topic);
}

import { Topic } from "@/types/topic";

export function formatMinutes(total: number) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Primeiro assunto pendente de cada matéria (mesma regra usada no cronograma semanal). */
export function getPendingTopicsBySubject(topics: Topic[]) {
    return topics.reduce((acc: Record<string, Topic>, topic) => {
        if (topic.status !== "CONCLUIDO" && topic.subject?.id && !acc[topic.subject.id]) {
            acc[topic.subject.id] = topic;
        }
        return acc;
    }, {});
}

export type TodayReview = { topic: Topic; number: 1 | 2 | 3 };

/** Revisões que vencem hoje (fuso de São Paulo), com a mesma regra de revisão pendente do cronograma. */
export function getTodayReviews(topics: Topic[]): TodayReview[] {
    const formatBR = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const today = formatBR(new Date());
    const result: TodayReview[] = [];

    topics.forEach((topic) => {
        if (topic.status !== "CONCLUIDO") return;

        let reviewDate: Date | null = null;
        let number: 1 | 2 | 3 = 1;

        if (!topic.reviews.first.concluded) {
            reviewDate = new Date(topic.reviews.first.date);
        } else if (!topic.reviews.second.concluded) {
            reviewDate = new Date(topic.reviews.second.date);
            number = 2;
        } else if (!topic.reviews.third.concluded) {
            reviewDate = new Date(topic.reviews.third.date);
            number = 3;
        }

        if (!reviewDate) return;

        reviewDate.setUTCHours(12, 0, 0, 0);
        if (formatBR(reviewDate) === today) result.push({ topic, number });
    });

    return result;
}

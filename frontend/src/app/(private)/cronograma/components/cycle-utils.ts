import { getDueReview } from "@/lib/review-due";
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

export type TodayReview = { topic: Topic; number: 1 | 2 | 3; overdueDays: number };

/** Revisões que vencem hoje ou estão atrasadas (as mais atrasadas primeiro). */
export function getTodayReviews(topics: Topic[]): TodayReview[] {
    const result: TodayReview[] = [];

    topics.forEach((topic) => {
        const due = getDueReview(topic);
        if (due) result.push({ topic, number: due.number, overdueDays: due.overdueDays });
    });

    return result.sort((a, b) => b.overdueDays - a.overdueDays);
}

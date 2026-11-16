import { getDueReview } from "@/lib/review-due";
import type { Topic } from "@/types/topic";

export type SubjectStats = {
    /** Assuntos contáveis (pastas com subassuntos só organizam e ficam de fora). */
    total: number;
    done: number;
    pending: number;
    percent: number;
    /** Revisões para hoje ou atrasadas. */
    dueReviews: number;
};

export function getSubjectStats(topics: Topic[]): SubjectStats {
    const countable = topics.filter((topic) => !topic.isContainer);
    const total = countable.length;
    const done = countable.filter((topic) => topic.status === "CONCLUIDO").length;

    return {
        total,
        done,
        pending: total - done,
        percent: total === 0 ? 0 : Math.round((done / total) * 100),
        dueReviews: countable.filter((topic) => getDueReview(topic) !== null).length,
    };
}

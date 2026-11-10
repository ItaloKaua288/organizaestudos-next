import type { Topic } from "@/types/topic";

/** Reta final: os últimos 14 dias antes da prova ficam reservados para revisão geral, não para assunto novo. */
export const REVIEW_BUFFER_DAYS = 14;
/** Janela (em dias) usada para medir o ritmo atual de estudo. */
export const PACE_WINDOW_DAYS = 14;

export type ExamPlanStatus =
    | "exam_passed"
    | "exam_today"
    | "no_topics"
    | "completed"
    | "final_stretch"
    | "not_started"
    | "on_track"
    | "behind";

export interface ExamPlan {
    status: ExamPlanStatus;
    /** Dia da prova (AAAA-MM-DD). */
    examDate: string;
    /** Dias até a prova (0 = hoje; negativo = já passou). */
    daysLeft: number;
    totalTopics: number;
    doneTopics: number;
    remainingTopics: number;
    /** Dias reservados no fim para revisão geral (reta final). */
    reviewBufferDays: number;
    /** Dia-meta para terminar os assuntos (AAAA-MM-DD). */
    studyDeadline: string;
    /** Dias disponíveis para estudar assuntos novos, contando hoje. */
    studyDaysLeft: number;
    /** Assuntos por semana necessários para fechar o edital na meta. Null quando não se aplica. */
    requiredPerWeek: number | null;
    /** Assuntos concluídos por semana nos últimos PACE_WINDOW_DAYS dias. */
    currentPerWeek: number;
    /** Assuntos concluídos na janela de ritmo. */
    recentDone: number;
    /** Dia previsto para terminar os assuntos mantendo o ritmo atual (AAAA-MM-DD). */
    projectedFinish: string | null;
    /** Dias de diferença entre a previsão e a meta: positivo = atrasado, negativo = adiantado. */
    projectedDaysLate: number | null;
}

const DAY_MS = 86_400_000;

const toDayNumber = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY_MS);
const fromDayNumber = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
const roundUp1 = (value: number) => Math.ceil(value * 10 - 1e-9) / 10;
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Hoje no horário de Brasília, como AAAA-MM-DD. */
export function todayInBrasilia(now: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}

/**
 * Dia em que o assunto foi concluído. A API agenda a 1ª revisão para o dia seguinte à conclusão,
 * então a conclusão é a data da 1ª revisão menos 1 dia.
 */
function completedOn(topic: Topic): number | null {
    const firstReview = topic.reviews?.first?.date;
    if (topic.status !== "CONCLUIDO" || !firstReview) return null;
    const day = toDayNumber(firstReview);
    return Number.isNaN(day) ? null : day - 1;
}

/** "AAAA-MM-DD" -> "DD/MM/AAAA". */
export function formatExamDate(iso: string): string {
    return iso.slice(0, 10).split("-").reverse().join("/");
}

/**
 * Planejamento reverso: a partir da data da prova, calcula quantos assuntos por semana é preciso
 * concluir para fechar o edital a tempo e compara com o ritmo real dos últimos 14 dias.
 * Todos os assuntos têm o mesmo peso. `topics` deve ter só assuntos "de verdade" (sem organizadores).
 */
export function computeExamPlan({ examDate, topics, today = todayInBrasilia() }: {
    examDate: string;
    topics: Topic[];
    today?: string;
}): ExamPlan {
    const todayDay = toDayNumber(today);
    const daysLeft = toDayNumber(examDate) - todayDay;

    const totalTopics = topics.length;
    const doneTopics = topics.filter((topic) => topic.status === "CONCLUIDO").length;
    const remainingTopics = totalTopics - doneTopics;

    const windowStart = todayDay - (PACE_WINDOW_DAYS - 1);
    const recentDone = topics.filter((topic) => {
        const day = completedOn(topic);
        return day !== null && day >= windowStart && day <= todayDay;
    }).length;
    const currentPerWeek = round1((recentDone / PACE_WINDOW_DAYS) * 7);

    const reviewBufferDays = REVIEW_BUFFER_DAYS;
    const studyDaysLeft = daysLeft - reviewBufferDays;

    const base: ExamPlan = {
        status: "on_track",
        examDate,
        daysLeft,
        totalTopics,
        doneTopics,
        remainingTopics,
        reviewBufferDays,
        studyDeadline: fromDayNumber(toDayNumber(examDate) - reviewBufferDays),
        studyDaysLeft,
        requiredPerWeek: null,
        currentPerWeek,
        recentDone,
        projectedFinish: null,
        projectedDaysLate: null,
    };

    if (daysLeft < 0) return { ...base, status: "exam_passed" };
    if (daysLeft === 0) return { ...base, status: "exam_today" };
    if (totalTopics === 0) return { ...base, status: "no_topics" };
    if (remainingTopics === 0) return { ...base, status: "completed" };
    if (studyDaysLeft <= 0) return { ...base, status: "final_stretch" };

    const requiredPerWeek = roundUp1(remainingTopics / (studyDaysLeft / 7));

    let projectedFinish: string | null = null;
    let projectedDaysLate: number | null = null;
    if (recentDone > 0) {
        const daysToFinish = Math.ceil(remainingTopics / (recentDone / PACE_WINDOW_DAYS));
        projectedFinish = fromDayNumber(todayDay + daysToFinish);
        projectedDaysLate = daysToFinish - studyDaysLeft;
    }

    const status: ExamPlanStatus =
        doneTopics === 0 && recentDone === 0 ? "not_started"
            : projectedDaysLate !== null && projectedDaysLate <= 0 ? "on_track"
                : "behind";

    return { ...base, status, requiredPerWeek, projectedFinish, projectedDaysLate };
}

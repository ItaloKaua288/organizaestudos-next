import type { Cycle } from "@/types/cycle";
import type { Timeline } from "@/types/timeline";
import type { Topic } from "@/types/topic";

/** Cookie onde fica a última ordem escolhida para a coluna "A estudar". */
export const ORDER_COOKIE = "kanban_ordem";

export type KanbanOrderMode = "padrao" | "cronograma" | "ciclo";

/** Ids das matérias na ordem em que devem aparecer, para cada fonte. Lista vazia = fonte sem matérias. */
export type SubjectOrders = { cronograma: string[]; ciclo: string[] };

export function parseOrderMode(value: string | undefined): KanbanOrderMode {
    return value === "cronograma" || value === "ciclo" ? value : "padrao";
}

const WEEK_DAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function unique(ids: string[]): string[] {
    return [...new Set(ids)];
}

/**
 * Matérias na ordem do cronograma semanal, a partir de hoje: primeiro os horários de hoje,
 * depois amanhã e assim por diante. Dentro de cada dia, pelo horário de início.
 * Uma matéria que aparece em vários horários conta só na primeira vez.
 */
export function getTimelineSubjectOrder(timelines: Timeline[], todayName: string): string[] {
    const todayIndex = Math.max(WEEK_DAYS.indexOf(todayName.toLowerCase()), 0);

    const slots = timelines
        .filter((timeline) => timeline.subject?.id)
        .map((timeline) => {
            const dayIndex = WEEK_DAYS.indexOf((timeline.day ?? "").toLowerCase());

            return {
                subjectId: timeline.subject!.id,
                // Dia desconhecido vai para o fim da semana.
                offset: dayIndex < 0 ? WEEK_DAYS.length : (dayIndex - todayIndex + WEEK_DAYS.length) % WEEK_DAYS.length,
                time: timeline.start_time ?? "",
            };
        })
        .sort((a, b) => a.offset - b.offset || a.time.localeCompare(b.time));

    return unique(slots.map((slot) => slot.subjectId));
}

/**
 * Matérias na ordem do ciclo de estudos, a partir da sessão atual (a próxima a estudar);
 * as sessões que já passaram nesta volta ficam para o fim, como no ciclo circular.
 */
export function getCycleSubjectOrder(cycle: Cycle | null): string[] {
    if (!cycle) return [];

    const usable = cycle.sessions.filter((session) => !session.inactive && !session.removed);
    const currentIndex = usable.findIndex((session) => session.id === cycle.currentSessionId);
    const rotated = currentIndex > 0 ? [...usable.slice(currentIndex), ...usable.slice(0, currentIndex)] : usable;

    return unique(rotated.map((session) => session.subject.id));
}

/**
 * Agrupa os assuntos por matéria na ordem dada. Dentro de cada matéria a ordem original é mantida,
 * e matérias que não estão na lista vão para o fim, também na ordem original.
 */
export function orderTopicsBySubject(topics: Topic[], subjectIds: string[]): Topic[] {
    const rank = new Map(subjectIds.map((id, index) => [id, index]));
    const notListed = subjectIds.length;

    return topics
        .map((topic, index) => ({ topic, index, rank: rank.get(topic.subject.id) ?? notListed }))
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map(({ topic }) => topic);
}

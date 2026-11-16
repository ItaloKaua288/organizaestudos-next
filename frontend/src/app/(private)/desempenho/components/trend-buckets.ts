import type { QuestionDailyPoint, QuestionHourlyPoint } from "@/types/question";

export type TrendRange = "today" | "7d" | "30d" | "all";
export type TrendGranularity = "hour" | "day" | "week";

export const TREND_RANGES: { key: TrendRange; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "all", label: "Sempre" },
];

export const DEFAULT_TREND_RANGE: TrendRange = "30d";

/** Um "pedaço" do eixo X: uma hora, um dia ou uma semana. `percent` é null quando não houve questões. */
export type TrendBucket = {
    key: string;
    /** Texto curto, usado no eixo X. */
    label: string;
    /** Texto completo, usado no tooltip e na tabela. */
    fullLabel: string;
    total: number;
    correct: number;
    percent: number | null;
};

export type TrendSource = {
    /** Dia de hoje em São Paulo (AAAA-MM-DD), vindo da API. */
    today: string;
    daily: QuestionDailyPoint[];
    hourly: QuestionHourlyPoint[];
};

export type TrendSeries = {
    granularity: TrendGranularity;
    buckets: TrendBucket[];
};

const DAY_MS = 86_400_000;
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
// Acima disso, "Sempre" passa a agrupar por semana para o gráfico não ficar poluído.
const ALL_WEEKLY_FROM_DAYS = 90;

// Todas as contas de data usam UTC puro sobre strings AAAA-MM-DD, então não dependem do fuso do navegador.
const parseDay = (day: string) => new Date(`${day}T00:00:00Z`);
const addDays = (day: string, amount: number) => new Date(parseDay(day).getTime() + amount * DAY_MS).toISOString().slice(0, 10);
const diffDays = (from: string, to: string) => Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS);
const mondayOf = (day: string) => addDays(day, -((parseDay(day).getUTCDay() + 6) % 7));

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const shortDayYear = (day: string) => `${shortDay(day)}/${day.slice(2, 4)}`;
const weekdayOf = (day: string) => WEEKDAYS[parseDay(day).getUTCDay()];

const percentOf = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 1000) / 10 : null);

const makeBucket = (key: string, label: string, fullLabel: string, total = 0, correct = 0): TrendBucket => ({
    key,
    label,
    fullLabel,
    total,
    correct,
    percent: percentOf(correct, total),
});

function dayBuckets(start: string, end: string, daily: QuestionDailyPoint[]): TrendBucket[] {
    const byDate = new Map(daily.map((point) => [point.date, point]));
    const count = diffDays(start, end) + 1;

    return Array.from({ length: Math.max(count, 0) }, (_, index) => {
        const date = addDays(start, index);
        const point = byDate.get(date);
        return makeBucket(date, shortDay(date), `${weekdayOf(date)}, ${shortDay(date)}`, point?.total, point?.correct);
    });
}

function weekBuckets(first: string, today: string, daily: QuestionDailyPoint[]): TrendBucket[] {
    const sums = new Map<string, { total: number; correct: number }>();
    for (const point of daily) {
        const key = mondayOf(point.date);
        const prev = sums.get(key) ?? { total: 0, correct: 0 };
        sums.set(key, { total: prev.total + point.total, correct: prev.correct + point.correct });
    }

    const start = mondayOf(first);
    const count = Math.round(diffDays(start, mondayOf(today)) / 7) + 1;
    const format = count > 52 ? shortDayYear : shortDay;

    return Array.from({ length: count }, (_, index) => {
        const weekStart = addDays(start, index * 7);
        const sum = sums.get(weekStart);
        return makeBucket(weekStart, format(weekStart), `Semana de ${format(weekStart)} a ${format(addDays(weekStart, 6))}`, sum?.total, sum?.correct);
    });
}

/** Monta o eixo X do gráfico para o filtro escolhido, já com os totais de cada pedaço. */
export function buildTrendSeries(range: TrendRange, source: TrendSource): TrendSeries {
    const { today, daily, hourly } = source;

    if (!today) return { granularity: "day", buckets: [] };

    if (range === "today") {
        const byHour = new Map(hourly.map((point) => [point.hour, point]));
        const buckets = Array.from({ length: 24 }, (_, hour) => {
            const label = `${String(hour).padStart(2, "0")}h`;
            const point = byHour.get(hour);
            return makeBucket(String(hour), label, `Hoje, ${label} às ${String((hour + 1) % 24).padStart(2, "0")}h`, point?.total, point?.correct);
        });
        return { granularity: "hour", buckets };
    }

    if (range === "7d") return { granularity: "day", buckets: dayBuckets(addDays(today, -6), today, daily) };
    if (range === "30d") return { granularity: "day", buckets: dayBuckets(addDays(today, -29), today, daily) };

    // Sempre: do primeiro registro até hoje.
    const first = daily[0]?.date;
    if (!first) return { granularity: "day", buckets: [] };

    if (diffDays(first, today) + 1 > ALL_WEEKLY_FROM_DAYS) {
        return { granularity: "week", buckets: weekBuckets(first, today, daily) };
    }

    // Garante pelo menos 7 dias no eixo, para quem começou agora não ver só 1 ou 2 pontos esticados.
    const sevenDaysAgo = addDays(today, -6);
    return { granularity: "day", buckets: dayBuckets(first < sevenDaysAgo ? first : sevenDaysAgo, today, daily) };
}

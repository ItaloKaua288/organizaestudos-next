export type Level = {
    label: "Fraco" | "Regular" | "Forte";
    /** Cor do texto (o percentual sempre aparece junto do rótulo, nunca só a cor). */
    text: string;
    bar: string;
    stroke: string;
};

/**
 * Faixas de desempenho a partir da meta de acerto: da meta para cima é forte, até 19 pontos abaixo dela é regular,
 * e 20 pontos ou mais abaixo é fraco. Com a meta padrão (80%): fraco abaixo de 60%, regular de 60% a 79%.
 */
export const DEFAULT_TARGET = 80;
export const TARGET_MIN = 60;
export const TARGET_MAX = 100;
export const TARGET_PRESETS = [70, 80, 85, 90, 95];
const WEAK_GAP = 20;

export const weakBelowOf = (target: number) => target - WEAK_GAP;

export function getLevel(percent: number, target: number = DEFAULT_TARGET): Level {
    if (percent < weakBelowOf(target)) {
        return { label: "Fraco", text: "text-red-600 dark:text-red-400", bar: "bg-red-500", stroke: "stroke-red-500" };
    }
    if (percent < target) {
        return { label: "Regular", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", stroke: "stroke-amber-500" };
    }
    return { label: "Forte", text: "text-primary dark:primary", bar: "bg-primary", stroke: "stroke-primary" };
}

export const formatPercent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

// Mais fracos primeiro; quem ainda não tem questões vai para o fim.
export const weakestFirst = <T extends { total: number; percent: number }>(a: T, b: T) => {
    if ((a.total === 0) !== (b.total === 0)) return a.total === 0 ? 1 : -1;
    return a.percent - b.percent;
};

// Assuntos só entram na lista de pontos fracos com uma amostra mínima, para 1 erro em 1 questão não virar alarme.
export const WEAK_MIN_QUESTIONS = 5;
export const WEAK_LIMIT = 8;

const TIMEZONE = "America/Sao_Paulo";

export const formatDay = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", { timeZone: TIMEZONE, day: "2-digit", month: "2-digit" });

export const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("pt-BR", { timeZone: TIMEZONE, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Assuntos com menos questões que isso mostram o aviso "amostra pequena": o % ainda oscila muito.
export const SMALL_SAMPLE_BELOW = WEAK_MIN_QUESTIONS;

export type SubjectSort = "weakest" | "strongest" | "volume" | "name";

export const SUBJECT_SORTS: { key: SubjectSort; label: string }[] = [
    { key: "weakest", label: "Mais fracas primeiro" },
    { key: "strongest", label: "Mais fortes primeiro" },
    { key: "volume", label: "Mais questões" },
    { key: "name", label: "Ordem alfabética" },
];

type Sortable = { title: string; total: number; percent: number };

export function sortComparator(sort: SubjectSort) {
    return <T extends Sortable>(a: T, b: T) => {
        if (sort === "weakest") return weakestFirst(a, b);
        if (sort === "name") return a.title.localeCompare(b.title, "pt-BR");
        if (sort === "volume") return b.total - a.total;
        // strongest: quem não tem questões continua no fim
        if ((a.total === 0) !== (b.total === 0)) return a.total === 0 ? 1 : -1;
        return b.percent - a.percent;
    };
}

/** Minúsculas e sem acento, para a busca achar "Matematica" ao digitar "matemática". */
export const normalizeText = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const DAY_MS = 86_400_000;
// Contas de data em UTC puro sobre strings AAAA-MM-DD (as mesmas usadas pela API), sem depender do fuso do navegador.
const addDays = (day: string, amount: number) => new Date(new Date(`${day}T00:00:00Z`).getTime() + amount * DAY_MS).toISOString().slice(0, 10);
const mondayOf = (day: string) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

type DailyLike = { date: string; total: number; correct: number };

export type PeriodTotals = { total: number; correct: number; percent: number | null };

export type ActivitySummary = {
    todayTotal: number;
    last7Total: number;
    /** Dias seguidos com questões. Não zera enquanto hoje ainda não tem registro: conta a partir de ontem. */
    streak: number;
    thisWeek: PeriodTotals;
    previousWeek: PeriodTotals;
};

/** Resumo de atividade a partir da evolução diária. Semanas de segunda a domingo, como no gráfico. */
export function summarizeActivity(today: string, daily: DailyLike[]): ActivitySummary {
    const byDate = new Map(daily.map((point) => [point.date, point]));

    const sumRange = (from: string, to: string): PeriodTotals => {
        let total = 0;
        let correct = 0;
        for (const point of daily) {
            if (point.date >= from && point.date <= to) {
                total += point.total;
                correct += point.correct;
            }
        }
        return { total, correct, percent: total > 0 ? Math.round((correct / total) * 1000) / 10 : null };
    };

    const monday = mondayOf(today);
    const thisWeek = sumRange(monday, today);
    const previousWeek = sumRange(addDays(monday, -7), addDays(monday, -1));

    let streak = 0;
    let cursor = (byDate.get(today)?.total ?? 0) > 0 ? today : addDays(today, -1);
    while ((byDate.get(cursor)?.total ?? 0) > 0) {
        streak++;
        cursor = addDays(cursor, -1);
    }

    return {
        todayTotal: byDate.get(today)?.total ?? 0,
        last7Total: sumRange(addDays(today, -6), today).total,
        streak,
        thisWeek,
        previousWeek,
    };
}

// Assunto praticado, mas sem questões há tantos dias, entra na aba "Parados".
export const STALE_AFTER_DAYS = 14;

/** Dias inteiros entre a data do último registro (fuso de São Paulo) e hoje (AAAA-MM-DD). */
export function daysSince(today: string, iso: string | null): number | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    const day = date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
    return Math.round((new Date(`${today}T00:00:00Z`).getTime() - new Date(`${day}T00:00:00Z`).getTime()) / 86_400_000);
}

/** Diferença entre dois percentuais, em pontos percentuais: "1,5%". Não confundir com variação relativa. */
export const formatPoints = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

/** % de acerto com uma casa decimal (0 quando não há questões). */
export const percentOf = (correct: number, total: number) => (total > 0 ? Math.round((correct / total) * 1000) / 10 : 0);

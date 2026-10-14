export type Level = {
    label: "Fraco" | "Regular" | "Forte";
    /** Cor do texto (o percentual sempre aparece junto do rótulo, nunca só a cor). */
    text: string;
    bar: string;
    stroke: string;
};

/** Faixas de desempenho: abaixo de 60% é fraco, de 60% a 79% é regular, de 80% para cima é forte. */
export const LEVEL_WEAK_BELOW = 60;
export const LEVEL_STRONG_FROM = 80;

export function getLevel(percent: number): Level {
    if (percent < LEVEL_WEAK_BELOW) {
        return { label: "Fraco", text: "text-red-600 dark:text-red-400", bar: "bg-red-500", stroke: "stroke-red-500" };
    }
    if (percent < LEVEL_STRONG_FROM) {
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

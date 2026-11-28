"use client";

import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPercent } from "./performance-utils";

type DailyLike = { date: string; total: number; correct: number };

type StudyHeatmapProps = {
    /** Dia de hoje em São Paulo (AAAA-MM-DD). */
    today: string;
    daily: DailyLike[];
};

const DAY_MS = 86_400_000;
const WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
// Linhas da grade: segunda a domingo. Só algumas levam rótulo para não poluir.
const ROW_LABELS: Record<number, string> = { 0: "seg", 2: "qua", 4: "sex", 6: "dom" };

const RANGES = [
    { key: 13, label: "3 meses" },
    { key: 26, label: "6 meses" },
    { key: 52, label: "12 meses" },
] as const;

// Contas em UTC puro sobre AAAA-MM-DD, sem depender do fuso do navegador.
const parse = (day: string) => new Date(`${day}T00:00:00Z`);
const addDays = (day: string, amount: number) => new Date(parse(day).getTime() + amount * DAY_MS).toISOString().slice(0, 10);
const mondayOf = (day: string) => addDays(day, -((parse(day).getUTCDay() + 6) % 7));
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const weekdayIndex = (day: string) => parse(day).getUTCDay();
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Cinco tons: sem questões + 4 faixas de volume, definidas pelos quartis dos dias com questões.
const LEVEL_CLASS = ["bg-foreground/8", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-heading text-xl font-semibold tabular-nums leading-tight">{value}</dd>
            {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

/** Calendário de constância (um quadrado por dia, mais escuro quanto mais questões) com os números ao lado. */
export function StudyHeatmap({ today, daily }: StudyHeatmapProps) {
    const [range, setRange] = useState<number>(26);
    const scrollRef = useRef<HTMLDivElement>(null);

    const model = useMemo(() => {
        const byDate = new Map(daily.map((point) => [point.date, point]));

        const weeks = range;
        const firstMonday = addDays(mondayOf(today), -(weeks - 1) * 7);

        const sorted = daily.filter((point) => point.date >= firstMonday && point.total > 0).map((point) => point.total).sort((a, b) => a - b);
        const quartile = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;
        const [q1, q2, q3] = [quartile(0.25), quartile(0.5), quartile(0.75)];
        const levelOf = (total: number) => (total <= 0 ? 0 : total <= q1 ? 1 : total <= q2 ? 2 : total <= q3 ? 3 : 4);

        const columns = Array.from({ length: weeks }, (_, week) => {
            const monday = addDays(firstMonday, week * 7);
            const cells = Array.from({ length: 7 }, (_, row) => {
                const date = addDays(monday, row);
                if (date > today) return { date, future: true as const };
                const point = byDate.get(date);
                const total = point?.total ?? 0;
                return { date, future: false as const, total, correct: point?.correct ?? 0, level: levelOf(total) };
            });
            return { monday, cells };
        });

        // Números do período, em ordem cronológica.
        let activeDays = 0;
        let dayCount = 0;
        let totalQuestions = 0;
        let bestStreak = 0;
        let streak = 0;
        let best: { date: string; total: number } | null = null;
        const weekdaySum = new Array(7).fill(0) as number[];
        const weekdayDays = new Array(7).fill(0) as number[];

        for (const column of columns) {
            for (const cell of column.cells) {
                if (cell.future) continue;
                dayCount++;
                weekdayDays[weekdayIndex(cell.date)]++;
                weekdaySum[weekdayIndex(cell.date)] += cell.total;
                if (cell.total > 0) {
                    activeDays++;
                    totalQuestions += cell.total;
                    streak++;
                    bestStreak = Math.max(bestStreak, streak);
                    if (!best || cell.total > best.total) best = { date: cell.date, total: cell.total };
                } else if (cell.date !== today) {
                    // Hoje sem questões ainda não quebra a sequência atual.
                    streak = 0;
                }
            }
        }

        let strongestWeekday: { index: number; average: number } | null = null;
        weekdaySum.forEach((sum, index) => {
            const average = weekdayDays[index] > 0 ? sum / weekdayDays[index] : 0;
            if (average > 0 && (!strongestWeekday || average > strongestWeekday.average)) strongestWeekday = { index, average };
        });

        return { columns, activeDays, dayCount, totalQuestions, bestStreak, currentStreak: streak, best, strongestWeekday };
    }, [daily, today, range]);

    // Começa mostrando os dias mais recentes (fim da grade) quando ela não cabe na tela.
    useEffect(() => {
        const element = scrollRef.current;
        if (element) element.scrollLeft = element.scrollWidth;
    }, [range]);

    const activePercent = model.dayCount > 0 ? Math.round((model.activeDays / model.dayCount) * 100) : 0;
    const strongest = model.strongestWeekday as { index: number; average: number } | null;

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
            {/* Calendário */}
            <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div role="group" aria-label="Período do calendário" className="flex gap-1 rounded-lg border border-border bg-foreground/4 p-0.5 text-xs">
                        {RANGES.map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                aria-pressed={range === option.key}
                                onClick={() => setRange(option.key)}
                                className={cn(
                                    "cursor-pointer rounded-md px-2.5 py-1 transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                    range === option.key ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Menos
                        {LEVEL_CLASS.map((className) => (
                            <span key={className} aria-hidden className={cn("h-3.5 w-3.5 rounded-[4px]", className)} />
                        ))}
                        Mais
                    </div>
                </div>

                <div ref={scrollRef} className="overflow-x-auto px-1 pb-2">
                    {/* Os quadrados esticam para ocupar a largura do card (até 44px cada); em telas estreitas rola para o lado. */}
                    <div
                        role="img"
                        aria-label={`Calendário de constância: ${model.activeDays} de ${model.dayCount} dias com questões, ${model.totalQuestions} questões no total`}
                        className="grid gap-1"
                        style={{
                            gridTemplateColumns: `1.75rem repeat(${range}, minmax(0, 1fr))`,
                            gridTemplateRows: "1rem repeat(7, auto)",
                            gridAutoFlow: "column",
                            minWidth: `${range * 20 + 28}px`,
                            maxWidth: `${range * 48 + 28}px`,
                        }}
                    >
                        {/* Coluna dos dias da semana */}
                        <span />
                        {Array.from({ length: 7 }, (_, row) => (
                            <span key={row} className="flex items-center text-[11px] leading-none text-muted-foreground">{ROW_LABELS[row] ?? ""}</span>
                        ))}

                        {model.columns.map((column, index) => {
                            const month = Number(column.monday.slice(5, 7)) - 1;
                            const previousMonth = index > 0 ? Number(model.columns[index - 1].monday.slice(5, 7)) - 1 : -1;
                            return [
                                <span key={`${column.monday}-m`} className="relative text-[11px] leading-none text-muted-foreground">
                                    {month !== previousMonth && index <= range - 3 && <span className="absolute left-0 top-0 whitespace-nowrap">{MONTHS[month]}</span>}
                                </span>,
                                ...column.cells.map((cell) =>
                                    cell.future ? (
                                        <span key={cell.date} className="aspect-square" />
                                    ) : (
                                        <span
                                            key={cell.date}
                                            title={
                                                cell.total > 0
                                                    ? `${WEEKDAYS_SHORT[weekdayIndex(cell.date)]}, ${shortDay(cell.date)}: ${cell.total} questões, ${formatPercent(Math.round((cell.correct / cell.total) * 1000) / 10)} de acerto`
                                                    : `${WEEKDAYS_SHORT[weekdayIndex(cell.date)]}, ${shortDay(cell.date)}: sem questões`
                                            }
                                            className={cn(
                                                "aspect-square rounded-md transition-[filter] duration-100 hover:brightness-125 motion-reduce:transition-none",
                                                LEVEL_CLASS[cell.level],
                                                cell.date === today && "ring-2 ring-inset ring-foreground/70"
                                            )}
                                        />
                                    )
                                ),
                            ];
                        })}
                    </div>
                </div>
            </div>

            {/* Números do período */}
            <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-5 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <Metric label="Dias com questões" value={model.activeDays} hint={`de ${model.dayCount} (${activePercent}%)`} />
                <Metric label="Sequência atual" value={plural(model.currentStreak, "dia", "dias")} hint={`melhor: ${plural(model.bestStreak, "dia", "dias")}`} />
                <Metric
                    label="Média por dia ativo"
                    value={model.activeDays > 0 ? Math.round(model.totalQuestions / model.activeDays) : "—"}
                    hint="questões"
                />
                <Metric
                    label="Melhor dia"
                    value={model.best ? model.best.total : "—"}
                    hint={model.best ? `${WEEKDAYS_SHORT[weekdayIndex(model.best.date)]}, ${shortDay(model.best.date)}` : undefined}
                />
                <div className="col-span-2">
                    <Metric
                        label="Dia da semana mais forte"
                        value={strongest ? WEEKDAYS[strongest.index] : "—"}
                        hint={strongest ? `média de ${Math.round(strongest.average)} questões nesse dia` : undefined}
                    />
                </div>
            </dl>
        </div>
    );
}

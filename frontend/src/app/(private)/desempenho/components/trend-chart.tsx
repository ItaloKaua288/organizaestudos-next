"use client";

import { LEVEL_WEAK_BELOW, formatDay, formatPercent } from "./performance-utils";
import { QuestionTrendPoint } from "@/types/question";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TrendChartProps = {
    points: QuestionTrendPoint[];
};

// O gráfico usa coordenadas em % (0 a 100). Os pontos ficam um pouco longe das bordas para não serem cortados.
const EDGE = 6;
const Y_TICKS = [0, 50, 100];

const xOf = (index: number, count: number) => (count === 1 ? 50 : EDGE + (index / (count - 1)) * (100 - EDGE * 2));
const yOf = (percent: number) => 100 - Math.min(100, Math.max(0, percent));

/**
 * Linha do % de acerto por semana. Passe o mouse (ou use Tab) nos pontos para ver os números da semana.
 * Os pontos são botões HTML, então o alvo de toque é maior que a marca e o texto não encolhe no celular.
 */
export function TrendChart({ points }: TrendChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const count = points.length;

    const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${xOf(index, count)},${yOf(point.percent)}`).join(" ");
    const area = `${line} L${xOf(count - 1, count)},100 L${xOf(0, count)},100 Z`;

    // Com muitas semanas, mostra uma data sim, outra não.
    const labelEvery = count > 8 ? 2 : 1;
    const active = activeIndex === null ? null : points[activeIndex];

    return (
        <div className="space-y-3">
            <div className="relative h-56 pb-7 pl-10 pr-2 pt-3" onPointerLeave={() => setActiveIndex(null)}>
                <div className="relative h-full w-full">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                        {Y_TICKS.map((tick) => (
                            <line key={tick} x1={0} x2={100} y1={yOf(tick)} y2={yOf(tick)} vectorEffect="non-scaling-stroke" className="stroke-border" strokeWidth={1} />
                        ))}
                        <line x1={0} x2={100} y1={yOf(LEVEL_WEAK_BELOW)} y2={yOf(LEVEL_WEAK_BELOW)} vectorEffect="non-scaling-stroke" className="stroke-red-500/60" strokeWidth={1} strokeDasharray="4 4" />
                        {count > 1 && <path d={area} className="fill-chart-3/10" />}
                        {count > 1 && <path d={line} fill="none" vectorEffect="non-scaling-stroke" className="stroke-chart-3" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                    </svg>

                    {Y_TICKS.map((tick) => (
                        <span key={tick} className="absolute right-full mr-2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground" style={{ top: `${yOf(tick)}%` }}>
                            {tick}%
                        </span>
                    ))}

                    {points.map((point, index) => (
                        <span
                            key={point.weekStart}
                            className={cn("absolute top-full mt-2 -translate-x-1/2 text-xs tabular-nums text-muted-foreground", index % labelEvery !== 0 && "hidden")}
                            style={{ left: `${xOf(index, count)}%` }}
                        >
                            {formatDay(point.weekStart)}
                        </span>
                    ))}

                    {points.map((point, index) => (
                        <button
                            key={point.weekStart}
                            type="button"
                            onPointerEnter={() => setActiveIndex(index)}
                            onFocus={() => setActiveIndex(index)}
                            onBlur={() => setActiveIndex(null)}
                            aria-label={`Semana de ${formatDay(point.weekStart)}: ${formatPercent(point.percent)}, ${point.correct} acertos em ${point.total} questões`}
                            className="group absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-default items-center justify-center rounded-full outline-none"
                            style={{ left: `${xOf(index, count)}%`, top: `${yOf(point.percent)}%` }}
                        >
                            <span
                                className={cn(
                                    "block h-3 w-3 rounded-full border-2 border-background bg-chart-3 transition-transform group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-ring",
                                    activeIndex === index && "scale-125"
                                )}
                            />
                        </button>
                    ))}

                    {active && activeIndex !== null && (
                        <div
                            role="status"
                            className={cn(
                                "pointer-events-none absolute z-10 w-max rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10",
                                active.percent > 70 ? "mt-4" : "-mt-4",
                                xOf(activeIndex, count) < 20 ? "" : xOf(activeIndex, count) > 80 ? "-translate-x-full" : "-translate-x-1/2",
                                active.percent > 70 ? "" : "-translate-y-full"
                            )}
                            style={{ left: `${xOf(activeIndex, count)}%`, top: `${yOf(active.percent)}%` }}
                        >
                            <p className="font-medium">Semana de {formatDay(active.weekStart)}</p>
                            <p className="tabular-nums">
                                <span className="font-semibold">{formatPercent(active.percent)}</span> · {active.correct} de {active.total} questões
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <details className="text-sm">
                <summary className="w-fit cursor-pointer text-muted-foreground hover:text-foreground">Ver em tabela</summary>
                <table className="mt-2 w-full max-w-md text-left tabular-nums">
                    <thead className="text-xs text-muted-foreground">
                        <tr>
                            <th className="py-1 pr-2 font-medium">Semana</th>
                            <th className="py-1 pr-2 font-medium">Questões</th>
                            <th className="py-1 pr-2 font-medium">Acertos</th>
                            <th className="py-1 font-medium">% de acerto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.map((point) => (
                            <tr key={point.weekStart} className="border-t">
                                <td className="py-1 pr-2">{formatDay(point.weekStart)}</td>
                                <td className="py-1 pr-2">{point.total}</td>
                                <td className="py-1 pr-2">{point.correct}</td>
                                <td className="py-1">{formatPercent(point.percent)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}

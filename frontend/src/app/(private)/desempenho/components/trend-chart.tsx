"use client";

import { formatPercent, formatPoints, getLevel, weakBelowOf } from "./performance-utils";
import { useTarget } from "./target";
import { DEFAULT_TREND_RANGE, TREND_RANGES, buildTrendSeries, type TrendBucket, type TrendRange, type TrendSource } from "./trend-buckets";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useId, useMemo, useRef, useState, type PointerEvent } from "react";

type TrendChartProps = TrendSource;

type Point = { bucket: TrendBucket; index: number; percent: number };

// O gráfico usa coordenadas em % (0 a 100). Os pontos ficam um pouco longe das bordas para não serem cortados.
const EDGE = 5;
const MAX_X_LABELS = 7;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Curva suave que passa por todos os pontos sem "estourar" acima/abaixo deles
 * (interpolação monotônica), para a linha não inventar picos que não existem.
 */
function smoothPath(points: { x: number; y: number }[]): string {
    const n = points.length;
    if (n === 0) return "";
    const fmt = (value: number) => value.toFixed(2);
    if (n === 1) return `M${fmt(points[0].x)},${fmt(points[0].y)}`;

    const dx: number[] = [];
    const slope: number[] = [];
    for (let i = 0; i < n - 1; i++) {
        dx.push(points[i + 1].x - points[i].x);
        slope.push((points[i + 1].y - points[i].y) / dx[i]);
    }

    const tangent: number[] = new Array(n);
    tangent[0] = slope[0];
    tangent[n - 1] = slope[n - 2];
    for (let i = 1; i < n - 1; i++) {
        if (slope[i - 1] * slope[i] <= 0) {
            tangent[i] = 0;
        } else {
            tangent[i] = (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]);
        }
    }

    let path = `M${fmt(points[0].x)},${fmt(points[0].y)}`;
    for (let i = 0; i < n - 1; i++) {
        const third = dx[i] / 3;
        path += ` C${fmt(points[i].x + third)},${fmt(points[i].y + tangent[i] * third)} ${fmt(points[i + 1].x - third)},${fmt(points[i + 1].y - tangent[i + 1] * third)} ${fmt(points[i + 1].x)},${fmt(points[i + 1].y)}`;
    }
    return path;
}

function Stat({ label, hint, tooltip, children }: { label: string; hint?: string; tooltip?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div
            className={cn("group relative min-w-0", tooltip && "cursor-help rounded-lg focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none")}
            tabIndex={tooltip ? 0 : undefined}
        >
            {tooltip && (
                <div
                    role="tooltip"
                    className="glass-popover pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-72 max-w-[85vw] space-y-1.5 rounded-xl p-3 text-xs font-normal leading-relaxed text-popover-foreground group-hover:block group-focus-visible:block"
                >
                    {tooltip}
                </div>
            )}
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="font-heading text-lg font-semibold tabular-nums leading-tight">{children}</dd>
            {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

/**
 * Evolução do % de acerto com filtro de período (Hoje, 7 dias, 30 dias, Sempre).
 * Passe o mouse, arraste o dedo ou use Tab nos pontos para ver os números. As barras de baixo mostram o volume de questões.
 */
export function TrendChart({ today, daily, hourly }: TrendChartProps) {
    const target = useTarget();
    const weakBelow = weakBelowOf(target);
    const [range, setRange] = useState<TrendRange>(DEFAULT_TREND_RANGE);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const plotRef = useRef<HTMLDivElement>(null);
    const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

    const { granularity, buckets } = useMemo(() => buildTrendSeries(range, { today, daily, hourly }), [range, today, daily, hourly]);
    const count = buckets.length;

    const points = useMemo<Point[]>(
        () => buckets.flatMap((bucket, index) => (bucket.percent === null ? [] : [{ bucket, index, percent: bucket.percent }])),
        [buckets]
    );

    // Resumo do período escolhido (soma ponderada, não média das médias).
    const total = points.reduce((sum, point) => sum + point.bucket.total, 0);
    const correct = points.reduce((sum, point) => sum + point.bucket.correct, 0);
    const periodPercent = total > 0 ? round1((correct / total) * 100) : 0;

    // Variação entre a média da 2ª metade do período e a da 1ª (soma ponderada de cada metade). Comparar só o
    // primeiro e o último ponto dava resultados ruidosos: um dia ruim no fim parecia queda de verdade.
    const half = (from: number, to: number) => {
        const slice = buckets.slice(from, to);
        const t = slice.reduce((sum, bucket) => sum + bucket.total, 0);
        const c = slice.reduce((sum, bucket) => sum + bucket.correct, 0);
        return t > 0 ? { total: t, correct: c, percent: (c / t) * 100 } : null;
    };
    const middle = Math.floor(count / 2);
    const firstHalf = half(0, middle);
    const secondHalf = half(middle, count);
    const delta = firstHalf && secondHalf ? round1(secondHalf.percent - firstHalf.percent) : null;
    const rangeOf = (from: number, to: number) => (to - from > 1 ? `${buckets[from].label} a ${buckets[to - 1].label}` : buckets[from]?.label ?? "");
    const maxTotal = Math.max(1, ...points.map((point) => point.bucket.total));

    // Eixo Y se ajusta aos dados (sempre incluindo a linha dos 60%), assim variações pequenas continuam visíveis.
    const lowest = Math.min(weakBelow, ...points.map((point) => point.percent));
    const rawMin = Math.floor((lowest - 10) / 10) * 10;
    const yMin = rawMin <= 10 ? 0 : rawMin;
    const span = 100 - yMin;
    const step = span <= 50 ? 10 : span <= 80 ? 20 : 25;
    const yTicks: number[] = [];
    for (let tick = 100; tick >= yMin; tick -= step) yTicks.push(tick);

    const yOf = (percent: number) => ((100 - Math.min(100, Math.max(yMin, percent))) / span) * 100;
    const xOf = (index: number) => (count === 1 ? 50 : EDGE + (index / (count - 1)) * (100 - EDGE * 2));
    const slot = count > 1 ? (100 - EDGE * 2) / (count - 1) : 100;
    const barWidth = Math.min(slot * 0.6, 4);

    const coords = points.map((point) => ({ x: xOf(point.index), y: yOf(point.percent) }));
    const line = smoothPath(coords);
    const area = coords.length > 1 ? `${line} L${coords[coords.length - 1].x.toFixed(2)},100 L${coords[0].x.toFixed(2)},100 Z` : "";

    // Rótulos do eixo X: poucos o bastante para não colidir. Datas contam a partir do fim para mostrar sempre a mais recente.
    const labelEvery = Math.max(1, Math.ceil(count / MAX_X_LABELS));
    const showLabel = (index: number) => (granularity === "hour" ? index % labelEvery === 0 : (count - 1 - index) % labelEvery === 0);

    const dense = points.length > 20;
    const veryDense = points.length > 40;
    const dotSize = veryDense ? "h-1.5 w-1.5" : dense ? "h-2 w-2" : "h-3 w-3";
    const hitSize = dense ? "h-5 w-5" : "h-8 w-8";

    const active = activeIndex === null ? null : (points[activeIndex] ?? null);
    const activeLevel = active ? getLevel(active.percent, target) : null;

    const selectRange = (next: TrendRange) => {
        setRange(next);
        setActiveIndex(null);
    };

    // Encaixa no ponto mais próximo do cursor, assim não precisa acertar a bolinha.
    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const rect = plotRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || points.length === 0) return;

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        let nearest = 0;
        let nearestDistance = Infinity;
        points.forEach((point, index) => {
            const distance = Math.abs(xOf(point.index) - x);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest = index;
            }
        });
        setActiveIndex(nearest);
    };

    return (
        <div className="space-y-4">
            {/* Filtro de período */}
            <div role="group" aria-label="Período do gráfico" className="grid grid-cols-4 gap-1 glass rounded-xl p-1 text-sm">
                {TREND_RANGES.map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => selectRange(key)}
                        aria-pressed={range === key}
                        className={cn(
                            "cursor-pointer rounded-lg px-2 py-2 transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none",
                            range === key ? "bg-primary/15 font-semibold text-primary" : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {points.length === 0 ? (
                <p className="flex min-h-108 items-center justify-center py-16 text-center text-sm text-muted-foreground">
                    {range === "all" ? "Nada por aqui ainda. Registre questões para ver sua evolução." : "Nenhuma questão registrada neste período. Tente um período maior."}
                </p>
            ) : (
                <>
                    {/* Resumo do período */}
                    <dl className="grid grid-cols-3 gap-4">
                        <Stat label="Acerto no período">
                            <span className={getLevel(periodPercent, target).text}>{formatPercent(periodPercent)}</span>
                        </Stat>
                        <Stat label="Questões feitas" hint={`${correct} acertos`}>
                            {total}
                        </Stat>
                        <Stat
                            label="Variação"
                            tooltip={
                                <>
                                    <p className="font-semibold">Como a variação é calculada</p>
                                    <p>
                                        O período é dividido em duas metades. Para cada uma, o % de acerto é o total de acertos dividido pelo total de questões da metade (não é a média dos dias). A variação é o % da 2ª metade menos o % da 1ª.
                                    </p>
                                    {firstHalf && secondHalf ? (
                                        <ul className="space-y-0.5 tabular-nums">
                                            <li>1ª metade ({rangeOf(0, middle)}): {firstHalf.correct}/{firstHalf.total} = {formatPercent(round1(firstHalf.percent))}</li>
                                            <li>2ª metade ({rangeOf(middle, count)}): {secondHalf.correct}/{secondHalf.total} = {formatPercent(round1(secondHalf.percent))}</li>
                                            <li className="font-semibold">Variação: {formatPercent(round1(secondHalf.percent))} − {formatPercent(round1(firstHalf.percent))} = {delta !== null && delta > 0 ? "+" : ""}{delta !== null ? formatPercent(delta) : ""}</li>
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground">Falta registrar questões nas duas metades para calcular.</p>
                                    )}
                                    <p className="text-muted-foreground">É a diferença em pontos percentuais, não um crescimento relativo.</p>
                                </>
                            }
                            hint={delta === null ? "Precisa de questões nas duas metades" : "2ª metade contra a 1ª"}>
                            {delta === null ? (
                                <span className="text-muted-foreground">—</span>
                            ) : delta === 0 ? (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Minus className="h-4 w-4" /> 0%
                                </span>
                            ) : delta > 0 ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                    <ArrowUpRight className="h-4 w-4" /> {formatPoints(delta)}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                    <ArrowDownRight className="h-4 w-4" /> {formatPoints(Math.abs(delta))}
                                </span>
                            )}
                        </Stat>
                    </dl>

                    {/* Linha do % de acerto */}
                    <div className="relative h-56 pb-7 pl-10 pr-2 pt-3" onPointerLeave={(event) => event.pointerType === "mouse" && setActiveIndex(null)}>
                        <div ref={plotRef} className="relative h-full w-full touch-pan-y" onPointerMove={handlePointerMove}>
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible text-primary" aria-hidden>
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                {yTicks.map((tick) => (
                                    <line key={tick} x1={0} x2={100} y1={yOf(tick)} y2={yOf(tick)} vectorEffect="non-scaling-stroke" className="stroke-border" strokeWidth={1} />
                                ))}
                                <line x1={0} x2={100} y1={yOf(weakBelow)} y2={yOf(weakBelow)} vectorEffect="non-scaling-stroke" className="stroke-destructive/60" strokeWidth={1} strokeDasharray="4 4" />
                                <line x1={0} x2={100} y1={yOf(target)} y2={yOf(target)} vectorEffect="non-scaling-stroke" className="stroke-primary/60" strokeWidth={1} />
                                {area && <path d={area} fill={`url(#${gradientId})`} />}
                                {coords.length > 1 && <path d={line} fill="none" vectorEffect="non-scaling-stroke" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
                            </svg>

                            {yTicks.map((tick) => (
                                <span key={tick} className="absolute right-full mr-2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground" style={{ top: `${yOf(tick)}%` }}>
                                    {tick}%
                                </span>
                            ))}

                            {buckets.map((bucket, index) => (
                                <span
                                    key={bucket.key}
                                    className={cn("absolute top-full mt-2 -translate-x-1/2 text-xs tabular-nums text-muted-foreground", !showLabel(index) && "hidden")}
                                    style={{ left: `${xOf(index)}%` }}
                                >
                                    {bucket.label}
                                </span>
                            ))}

                            {/* Guia vertical do ponto ativo */}
                            {active && <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-primary/30" style={{ left: `${xOf(active.index)}%` }} />}

                            {points.map((point, index) => (
                                <button
                                    key={point.bucket.key}
                                    type="button"
                                    onPointerEnter={() => setActiveIndex(index)}
                                    onFocus={() => setActiveIndex(index)}
                                    onBlur={() => setActiveIndex(null)}
                                    aria-label={`${point.bucket.fullLabel}: ${formatPercent(point.percent)}, ${point.bucket.correct} acertos em ${point.bucket.total} questões`}
                                    className={cn("group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-default items-center justify-center rounded-full outline-none", hitSize)}
                                    style={{ left: `${xOf(point.index)}%`, top: `${yOf(point.percent)}%` }}
                                >
                                    <span
                                        className={cn(
                                            "block rounded-full border-2 border-background transition-shadow duration-150 group-hover:ring-4 group-hover:ring-primary/25 group-focus-visible:ring-4 group-focus-visible:ring-primary/40 motion-reduce:transition-none",
                                            dotSize,
                                            getLevel(point.percent, target).bar,
                                            activeIndex === index && "ring-4 ring-primary/25"
                                        )}
                                    />
                                </button>
                            ))}

                            {active && activeLevel && activeIndex !== null && (
                                <div
                                    role="status"
                                    className={cn(
                                        "pointer-events-none absolute z-10 w-max glass-popover rounded-xl px-3 py-2 text-xs text-popover-foreground",
                                        yOf(active.percent) < 45 ? "mt-4" : "-mt-4 -translate-y-full",
                                        xOf(active.index) < 20 ? "" : xOf(active.index) > 80 ? "-translate-x-full" : "-translate-x-1/2"
                                    )}
                                    style={{ left: `${xOf(active.index)}%`, top: `${yOf(active.percent)}%` }}
                                >
                                    <p className="font-medium">{active.bucket.fullLabel}</p>
                                    <p className="tabular-nums">
                                        <span className={cn("font-semibold", activeLevel.text)}>{formatPercent(active.percent)}</span> · {activeLevel.label}
                                    </p>
                                    <p className="tabular-nums text-muted-foreground">
                                        {active.bucket.correct} acertos em {active.bucket.total} questões
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Volume de questões, alinhado com os pontos da linha */}
                    <div aria-hidden className="relative h-10 pl-10 pr-2">
                        <div className="relative h-full w-full border-b border-border">
                            {points.map((point, index) => (
                                <span
                                    key={point.bucket.key}
                                    className={cn("absolute bottom-0 min-w-0.5 -translate-x-1/2 rounded-t-sm transition-colors duration-150 motion-reduce:transition-none", activeIndex === index ? "bg-primary/60" : "bg-foreground/15")}
                                    style={{ left: `${xOf(point.index)}%`, width: `${barWidth}%`, height: `${Math.max(10, (point.bucket.total / maxTotal) * 100)}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Linha: % de acerto · Barras: questões feitas · Tracejado: {weakBelow}% · Meta: {target}%
                    </p>

                    <details className="text-sm">
                        <summary className="w-fit cursor-pointer rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">Ver em tabela</summary>
                        <div className="mt-2 max-h-64 max-w-md overflow-auto">
                            <table className="w-full text-left tabular-nums">
                                <thead className="sticky top-0 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="py-1 pr-2 font-medium">Período</th>
                                        <th className="py-1 pr-2 font-medium">Questões</th>
                                        <th className="py-1 pr-2 font-medium">Acertos</th>
                                        <th className="py-1 font-medium">% de acerto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.map((point) => (
                                        <tr key={point.bucket.key} className="border-t border-border">
                                            <td className="py-1 pr-2">{point.bucket.fullLabel}</td>
                                            <td className="py-1 pr-2">{point.bucket.total}</td>
                                            <td className="py-1 pr-2">{point.bucket.correct}</td>
                                            <td className="py-1">{formatPercent(point.percent)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </>
            )}
        </div>
    );
}

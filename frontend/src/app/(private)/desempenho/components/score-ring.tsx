import { cn } from "@/lib/utils";
import { formatPercent, getLevel } from "./performance-utils";

type ScoreRingProps = {
    percent: number;
    /** Sem questões registradas: mostra o anel vazio. */
    empty?: boolean;
};

const SIZE = 136;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anel com o % de acerto geral no centro e a faixa (Fraco/Regular/Forte) escrita embaixo. */
export function ScoreRing({ percent, empty = false }: ScoreRingProps) {
    const level = getLevel(percent);
    const value = Math.min(100, Math.max(0, percent));

    return (
        <div
            className="relative shrink-0"
            style={{ width: SIZE, height: SIZE }}
            role="img"
            aria-label={empty ? "Sem questões registradas" : `Desempenho geral: ${formatPercent(percent)}, ${level.label}`}
        >
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
                <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-foreground/10" />
                {!empty && (
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
                        className={cn(level.stroke, "transition-[stroke-dashoffset] duration-150 motion-reduce:transition-none")}
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {empty ? (
                    <span className="font-heading text-2xl font-semibold text-muted-foreground">—</span>
                ) : (
                    <>
                        <span className={cn("font-heading text-3xl font-semibold tabular-nums", level.text)}>{formatPercent(percent)}</span>
                        <span className="text-xs text-muted-foreground">{level.label}</span>
                    </>
                )}
            </div>
        </div>
    );
}

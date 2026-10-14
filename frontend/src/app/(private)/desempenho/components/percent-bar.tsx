import { cn } from "@/lib/utils";
import { LEVEL_STRONG_FROM, LEVEL_WEAK_BELOW } from "./performance-utils";

type PercentBarProps = {
    percent: number;
    className: string;
    label: string;
};

/** Barra de % de acerto. Os dois traços marcam onde começam "Regular" (60%) e "Forte" (80%). */
export function PercentBar({ percent, className, label }: PercentBarProps) {
    const value = Math.min(100, Math.max(0, percent));

    return (
        <div
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        >
            <div className={cn("h-full rounded-full transition-[width]", className)} style={{ width: `${value}%` }} />
            {[LEVEL_WEAK_BELOW, LEVEL_STRONG_FROM].map((mark) => (
                <span key={mark} aria-hidden className="absolute inset-y-0 w-px bg-background/80" style={{ left: `${mark}%` }} />
            ))}
        </div>
    );
}

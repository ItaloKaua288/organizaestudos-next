import { cn } from "@/lib/utils";
import { weakBelowOf } from "./performance-utils";
import { useTarget } from "./target";

type PercentBarProps = {
    percent: number;
    className: string;
    label: string;
};

/** Barra de % de acerto. Os dois traços marcam onde começam "Regular" e "Forte" (a meta). */
export function PercentBar({ percent, className, label }: PercentBarProps) {
    const target = useTarget();
    const value = Math.min(100, Math.max(0, percent));

    return (
        <div
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
        >
            <div className={cn("h-full rounded-full transition-[width] duration-150 motion-reduce:transition-none", className)} style={{ width: `${value}%` }} />
            {[weakBelowOf(target), target].map((mark) => (
                <span key={mark} aria-hidden className="absolute inset-y-0 w-px bg-background/70" style={{ left: `${mark}%` }} />
            ))}
        </div>
    );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";

type OverdueLevel = { icon: LucideIcon; range: string; className: string };

/** Gravidade do atraso: 1 dia (amarelo), até 1 semana (laranja) e mais de 1 semana (vermelho). Sempre com ícone e texto. */
export function getOverdueLevel(days: number): OverdueLevel {
    if (days <= 1) {
        return { icon: Clock, range: "1 dia", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
    }
    if (days <= 7) {
        return { icon: TriangleAlert, range: "até 1 semana", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300" };
    }
    return { icon: OctagonAlert, range: "mais de 1 semana", className: "bg-red-500/15 text-red-700 dark:text-red-300" };
}

type OverdueBadgeProps = {
    /** Dias de atraso (maior que 0). */
    days: number;
    /** "Atrasado" para assuntos, "Atrasada" para sessões. */
    label?: string;
    className?: string;
};

export function OverdueBadge({ days, label = "Atrasado", className }: OverdueBadgeProps) {
    const level = getOverdueLevel(days);
    const Icon = level.icon;

    return (
        <Badge className={cn(level.className, className)} title={`${label} há ${days} ${days === 1 ? "dia" : "dias"} (${level.range})`}>
            <Icon aria-hidden="true" />
            {label} {days}d
        </Badge>
    );
}

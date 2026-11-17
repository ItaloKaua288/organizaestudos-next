import { cn } from "@/lib/utils";
import { CycleSession } from "@/types/cycle";
import { RotateCw } from "lucide-react";

/** Marcador da sessão: bolinha colorida da matéria ou, na sessão de revisão, o ícone de revisão. */
export function SessionMarker({ session, size = "sm", className }: { session: CycleSession; size?: "sm" | "lg"; className?: string }) {
    if (session.kind === "REVISAO") {
        return (
            <RotateCw
                aria-hidden="true"
                className={cn("shrink-0 text-primary", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5", className)}
            />
        );
    }
    return (
        <span
            aria-hidden="true"
            className={cn("shrink-0 rounded-full", size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5", className)}
            style={{ backgroundColor: session.subject.color }}
        />
    );
}

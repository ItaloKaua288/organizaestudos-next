"use client"

import { BodyDragOverlay } from "@/lib/drag-kit";
import { CycleSession } from "@/types/cycle";
import { GripVertical } from "lucide-react";
import { formatMinutes } from "./cycle-utils";

/**
 * Cópia flutuante da sessão que acompanha o ponteiro enquanto ela é arrastada.
 * Deve ficar dentro do <DndContext> da lista.
 */
export function CycleDragGhost({ session }: { session: CycleSession | null }) {
    return (
        <BodyDragOverlay>
            {session ? (
                <div className="flex w-full rotate-[1.5deg] cursor-grabbing items-center gap-3 glass-strong rounded-xl px-3 py-2 text-sm ring-1 ring-primary/60 shadow-[0_20px_44px_-14px_var(--glass-shadow)]">
                    <GripVertical size={16} className="shrink-0 text-muted-foreground" />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: session.subject.color }} />
                    <span className="flex-1 truncate font-medium">{session.subject.title}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(session.duration)}</span>
                </div>
            ) : null}
        </BodyDragOverlay>
    );
}

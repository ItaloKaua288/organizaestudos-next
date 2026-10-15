"use client"

import { GripVertical } from "lucide-react";
import { RefObject } from "react";
import { createPortal } from "react-dom";
import { CycleDragGhostData } from "./use-cycle-reorder";
import { formatMinutes } from "./cycle-utils";

/** Cópia flutuante da sessão que aparece "na mão" enquanto ela é arrastada. */
export function CycleDragGhost({ ghost, elementRef }: { ghost: CycleDragGhostData | null; elementRef: RefObject<HTMLDivElement | null> }) {
    if (!ghost) return null;

    const { session, width, left, top } = ghost;

    // Portal no <body>: evita que um pai com transform/animação quebre o position: fixed.
    return createPortal(
        <div
            ref={elementRef}
            style={{
                position: "fixed",
                left: 0,
                top: 0,
                width,
                zIndex: 9999,
                pointerEvents: "none",
                transform: `translate3d(${left}px, ${top}px, 0)`,
            }}
            className="flex cursor-grabbing items-center gap-3 glass-strong rounded-xl px-3 py-2 text-sm ring-1 ring-primary/40"
        >
            <GripVertical size={16} className="shrink-0 text-muted-foreground" />
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: session.subject.color }} />
            <span className="flex-1 truncate font-medium">{session.subject.title}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(session.duration)}</span>
        </div>,
        document.body
    );
}

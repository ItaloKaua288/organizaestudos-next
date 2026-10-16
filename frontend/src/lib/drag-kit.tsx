"use client";

import {
    DragOverlay,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    useSensor,
    useSensors,
    type CollisionDetection,
} from "@dnd-kit/core";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Peças de arrastar e soltar compartilhadas pelas listas reordenáveis (assuntos e ciclo).
 * Usam a mesma biblioteca (@dnd-kit/core) e a mesma configuração do quadro Kanban.
 */

// Solta na linha sob o ponteiro; sem ponteiro (ou fora de qualquer linha) cai para a maior área sobreposta.
export const rowCollisionDetection: CollisionDetection = (args) => {
    const underPointer = pointerWithin(args);
    return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

/**
 * Sensores de mouse e toque para listas com alça de arrastar.
 * Mouse: o arrasto começa depois de mover 4 px (um clique simples não arrasta).
 * Toque: segurar o dedo ~0,15 s na alça começa o arrasto.
 */
export function useRowSensors() {
    return useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
    );
}

function subscribeReducedMotion(onChange: () => void) {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

const subscribeNothing = () => () => { };

/** false no servidor e na hidratação, true no navegador: o portal só pode existir onde há `document`. */
function useIsClient() {
    return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

function usePrefersReducedMotion() {
    return useSyncExternalStore(
        subscribeReducedMotion,
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        () => false
    );
}

/**
 * Cópia que acompanha o ponteiro durante o arrasto. Fica no <body>, fora da página: a animação de
 * entrada das telas mantém um transform ativo e faria a cópia ser posicionada longe do ponteiro.
 * Deve ser renderizado dentro de um <DndContext>.
 */
export function BodyDragOverlay({ children }: { children: ReactNode }) {
    const reducedMotion = usePrefersReducedMotion();
    const isClient = useIsClient();

    if (!isClient) return null;

    return createPortal(
        <DragOverlay dropAnimation={reducedMotion ? null : undefined}>{children}</DragOverlay>,
        document.body
    );
}

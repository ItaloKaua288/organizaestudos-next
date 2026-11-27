"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { DEFAULT_TARGET, TARGET_MAX, TARGET_MIN } from "./performance-utils";

const STORAGE_KEY = "desempenho-target";
const CHANGE_EVENT = "desempenho-target-change";

const clampTarget = (value: number) => Math.min(TARGET_MAX, Math.max(TARGET_MIN, Math.round(value)));

function readTarget(): number {
    try {
        const raw = Number(localStorage.getItem(STORAGE_KEY));
        return Number.isFinite(raw) && raw > 0 ? clampTarget(raw) : DEFAULT_TARGET;
    } catch {
        // localStorage indisponível: usa a meta padrão
        return DEFAULT_TARGET;
    }
}

const subscribe = (callback: () => void) => {
    window.addEventListener(CHANGE_EVENT, callback);
    window.addEventListener("storage", callback);
    return () => {
        window.removeEventListener(CHANGE_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
};

/** Meta de acerto do usuário (guardada neste navegador). No servidor e na hidratação usa a meta padrão. */
export function useTargetStorage(): [number, (value: number) => void] {
    const target = useSyncExternalStore(subscribe, readTarget, () => DEFAULT_TARGET);

    const setTarget = useCallback((value: number) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(clampTarget(value)));
        } catch {
            // sem localStorage a meta vale só até recarregar
        }
        window.dispatchEvent(new Event(CHANGE_EVENT));
    }, []);

    return [target, setTarget];
}

const TargetContext = createContext<number>(DEFAULT_TARGET);

export const TargetProvider = TargetContext.Provider;

/** Meta de acerto atual, para barras, anel e gráfico usarem as mesmas faixas. */
export const useTarget = () => useContext(TargetContext);

"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EXAM_SIZE_DEFAULT, EXAM_SIZE_MAX, EXAM_SIZE_MIN } from "./performance-utils";

const STORAGE_KEY = "desempenho-exam-size";
const CHANGE_EVENT = "desempenho-exam-size-change";

const clamp = (value: number) => Math.min(EXAM_SIZE_MAX, Math.max(EXAM_SIZE_MIN, Math.round(value)));

function read(): number {
    try {
        const raw = Number(localStorage.getItem(STORAGE_KEY));
        return Number.isFinite(raw) && raw > 0 ? clamp(raw) : EXAM_SIZE_DEFAULT;
    } catch {
        // localStorage indisponível: usa o padrão
        return EXAM_SIZE_DEFAULT;
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

/** Quantas questões tem a prova real (guardado neste navegador). */
export function useExamSize(): [number, (value: number) => void] {
    const size = useSyncExternalStore(subscribe, read, () => EXAM_SIZE_DEFAULT);

    const setSize = useCallback((value: number) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(clamp(value)));
        } catch {
            // sem localStorage vale só até recarregar
        }
        window.dispatchEvent(new Event(CHANGE_EVENT));
    }, []);

    return [size, setSize];
}

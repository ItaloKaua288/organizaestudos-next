"use client";

import type { ReactNode } from "react";
import toast from "react-hot-toast";

const ACTION_CLASS =
    "shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40";

/** Monta "Prefixo: motivo". Aceita a mensagem da API (string) ou um erro capturado; sem motivo útil, devolve só o prefixo. */
export function describeFailure(prefix: string, source?: unknown): string {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return `${prefix}: sem conexão com a internet.`;
    }

    const raw = typeof source === "string" ? source : source instanceof Error ? source.message : "";
    const reason = raw.trim().replace(/[.\s]+$/, "");

    if (!reason) return `${prefix}.`;
    // Erros genéricos do servidor/rede não ajudam; o "Tentar de novo" cobre esses casos.
    if (/^an error occurred in the server components render/i.test(reason)) return `${prefix}.`;
    if (/failed to fetch|networkerror|load failed|fetch failed/i.test(reason)) {
        return `${prefix}: não foi possível falar com o servidor.`;
    }

    return `${prefix}: ${reason}.`;
}

type ToastErrorOptions = {
    id?: string;
    /** Quando informado, o toast ganha o botão "Tentar de novo". */
    retry?: () => void;
};

/** Toast de erro com o motivo e, opcionalmente, um botão para tentar de novo. */
export function toastError(message: string, { id, retry }: ToastErrorOptions = {}) {
    if (!retry) return toast.error(message, { id });

    return toast.error(
        (t) => (
            <span className="flex items-center gap-2">
                <span>{message}</span>
                <button
                    type="button"
                    className={ACTION_CLASS}
                    onClick={() => {
                        // Com id fixo, o retry reaproveita o mesmo toast (vira "carregando"); sem id, fecha este.
                        if (!id) toast.dismiss(t.id);
                        retry();
                    }}
                >
                    Tentar de novo
                </button>
            </span>
        ),
        { id, duration: 8000 }
    );
}

/** Toast de sucesso com botão "Desfazer", para ações que podem ser revertidas depois de feitas. */
export function toastUndo(message: ReactNode, onUndo: () => void, { id, duration = 8000 }: { id?: string; duration?: number } = {}) {
    return toast.success(
        (t) => (
            <span className="flex items-center gap-2">
                <span>{message}</span>
                <button
                    type="button"
                    className={ACTION_CLASS}
                    onClick={() => {
                        toast.dismiss(t.id);
                        onUndo();
                    }}
                >
                    Desfazer
                </button>
            </span>
        ),
        { id, duration }
    );
}

"use client";

import { setAppearanceAction } from "@/actions/layout.actions";
import type { AppearancePrefs } from "@/lib/layout-preference";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

type Ctx = { prefs: AppearancePrefs; update: (patch: Partial<AppearancePrefs>) => void };

const NavPrefsContext = createContext<Ctx | null>(null);

/**
 * Estado das preferências de aparência. Os valores iniciais vêm dos cookies (lidos no servidor, sem "pulo"
 * na primeira pintura); ao mudar, a tela atualiza na hora e o cookie é salvo em segundo plano.
 */
export function NavPrefsProvider({ initial, children }: { initial: AppearancePrefs; children: ReactNode }) {
    const [prefs, setPrefs] = useState(initial);
    const current = useRef(initial);

    useEffect(() => {
        document.documentElement.dataset.density = prefs.density;
    }, [prefs.density]);

    const update = useCallback((patch: Partial<AppearancePrefs>) => {
        const previous = current.current;
        const next = { ...previous, ...patch };
        current.current = next;
        setPrefs(next);

        setAppearanceAction(patch)
            .then((result) => {
                if (!result.success) throw new Error();
            })
            .catch(() => {
                // Desfaz só o que esta chamada mexeu, sem pisar em mudanças feitas depois dela.
                const revert: Partial<AppearancePrefs> = {};
                for (const key of Object.keys(patch) as (keyof AppearancePrefs)[]) {
                    (revert as Record<string, unknown>)[key] = previous[key];
                }
                current.current = { ...current.current, ...revert };
                setPrefs(current.current);
                toast.error("Erro ao salvar a preferência.", { id: "appearance-save" });
            });
    }, []);

    const value = useMemo(() => ({ prefs, update }), [prefs, update]);
    return <NavPrefsContext.Provider value={value}>{children}</NavPrefsContext.Provider>;
}

export function useNavPrefs(): Ctx {
    const ctx = useContext(NavPrefsContext);
    if (!ctx) throw new Error("useNavPrefs precisa estar dentro de NavPrefsProvider.");
    return ctx;
}

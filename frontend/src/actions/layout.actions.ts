"use server";

import { PREF_COOKIES, readPrefs, serializePref, type AppearancePrefs } from "@/lib/layout-preference";
import { cookies } from "next/headers";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Salva preferências de aparência (layout, lado, recolhida, densidade, largura) em cookies. */
export async function setAppearanceAction(patch: Partial<AppearancePrefs>): Promise<{ success: boolean }> {
    const cookieStore = await cookies();

    // Valida passando por readPrefs: valores inválidos viram o padrão, nunca chegam ao cookie.
    const incoming = new Map<string, string>();
    for (const key of Object.keys(PREF_COOKIES) as (keyof AppearancePrefs)[]) {
        if (patch[key] !== undefined) incoming.set(PREF_COOKIES[key], serializePref(key, patch[key]));
    }
    const safe = readPrefs((name) => incoming.get(name));

    for (const key of Object.keys(PREF_COOKIES) as (keyof AppearancePrefs)[]) {
        if (patch[key] === undefined) continue;
        cookieStore.set(PREF_COOKIES[key], serializePref(key, safe[key]), {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: ONE_YEAR,
        });
    }
    return { success: true };
}

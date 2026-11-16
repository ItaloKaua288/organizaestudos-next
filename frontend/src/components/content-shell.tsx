"use client";

import { useNavPrefs } from "@/components/nav-prefs-provider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const MAX_WIDTH = {
    narrow: "max-w-5xl",
    default: "max-w-7xl",
    wide: "max-w-[96rem]",
} as const;

/**
 * Área de conteúdo das telas. Reserva espaço para a sidebar (a partir de xl) conforme o lado e se está
 * recolhida, e aplica a largura máxima escolhida. `profileKey` recria o conteúdo ao trocar de perfil.
 */
export function ContentShell({ profileKey, children }: { profileKey: string; children: ReactNode }) {
    const { prefs } = useNavPrefs();
    const sidebar = prefs.layout === "sidebar";

    return (
        <div
            className={cn(
                "w-full flex-1 transition-[padding] duration-200 ease-out",
                sidebar && prefs.side === "left" && (prefs.collapsed ? "xl:pl-24" : "xl:pl-64"),
                sidebar && prefs.side === "right" && (prefs.collapsed ? "xl:pr-24" : "xl:pr-64")
            )}
        >
            <div
                key={profileKey}
                className={cn(
                    "mx-auto w-full px-4 pt-24 pb-28 sm:px-6 xl:pb-16 lg:px-8",
                    MAX_WIDTH[prefs.width],
                    sidebar && "xl:pt-10"
                )}
            >
                {children}
            </div>
        </div>
    );
}

"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, ListTree } from "lucide-react";
import { LAYOUT_COOKIE, MateriasLayout } from "./layout-cookie";

type LayoutToggleProps = {
    value: MateriasLayout;
    onChange: (layout: MateriasLayout) => void;
};

const ONE_YEAR = 60 * 60 * 24 * 365;

const OPTIONS = [
    { key: "detalhado", label: "Detalhado", title: "Matérias com todos os assuntos", Icon: ListTree },
    { key: "compacto", label: "Compacto", title: "Apenas as matérias", Icon: LayoutGrid },
] as const;

export function LayoutToggle({ value, onChange }: LayoutToggleProps) {
    const select = (layout: MateriasLayout) => {
        document.cookie = `${LAYOUT_COOKIE}=${layout}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
        onChange(layout);
    };

    return (
        <div role="group" aria-label="Alternar layout das matérias" className="inline-flex items-center gap-1 glass rounded-xl p-1 text-sm">
            {OPTIONS.map(({ key, label, title, Icon }) => (
                <button
                    key={key}
                    type="button"
                    title={title}
                    aria-pressed={value === key}
                    onClick={() => select(key)}
                    className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.8rem] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                        value === key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                    )}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="max-sm:hidden">{label}</span>
                </button>
            ))}
        </div>
    );
}

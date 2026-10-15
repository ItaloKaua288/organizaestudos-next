"use client";

import { cn } from "@/lib/utils";
import { CalendarDays, RefreshCw } from "lucide-react";
import Link from "next/link";
import { VIEW_COOKIE } from "./view-cookie";

type ViewToggleProps = {
    active: "cronograma" | "ciclo";
};

const ONE_YEAR = 60 * 60 * 24 * 365;

function saveView(view: string) {
    document.cookie = `${VIEW_COOKIE}=${view}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}

const OPTIONS = [
    { key: "cronograma", label: "Cronograma", href: "/cronograma?view=cronograma", Icon: CalendarDays },
    { key: "ciclo", label: "Ciclo de estudos", href: "/cronograma?view=ciclo", Icon: RefreshCw },
] as const;

export function ViewToggle({ active }: ViewToggleProps) {
    return (
        <nav aria-label="Alternar visualização" className="inline-flex items-center gap-1 glass rounded-xl p-1 text-sm">
            {OPTIONS.map(({ key, label, href, Icon }) => (
                <Link
                    key={key}
                    href={href}
                    onClick={() => saveView(key)}
                    aria-current={active === key ? "page" : undefined}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                        active === key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                    )}
                >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{label}</span>
                </Link>
            ))}
        </nav>
    );
}

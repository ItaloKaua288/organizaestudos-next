"use client";

import { cn } from "@/lib/utils";
import { AdminUser } from "@/types/admin";
import { useEffect, useState } from "react";
import { activityTier, ActivityTier, count } from "./admin-utils";

const MAX_TICKS = 72;

// Larguras variadas (determinísticas): a faixa lembra o código de barras do cartão da página de perfil.
const weightOf = (index: number) => 1 + ((index * 7 + 3) % 5 === 0 ? 2 : (index * 5) % 3 === 0 ? 1 : 0);

const TIER_STYLE: Record<ActivityTier, string> = {
    recent: "bg-primary",
    mid: "bg-primary/45",
    idle: "bg-background/25",
};

const TIER_LABEL: Record<ActivityTier, string> = {
    recent: "Até 7 dias",
    mid: "De 8 a 30 dias",
    idle: "Mais de 30 dias",
};

const TIERS: ActivityTier[] = ["recent", "mid", "idle"];

/**
 * Resumo da base de usuários: cada barra é um usuário, ordenado do acesso mais recente ao mais antigo.
 * A cor mostra há quanto tempo a pessoa acessou o app pela última vez.
 */
export function ActivityStrip({ users, now }: { users: AdminUser[]; now: number }) {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const totals: Record<ActivityTier, number> = { recent: 0, mid: 0, idle: 0 };
    for (const user of users) totals[activityTier(user.lastLogin, now)] += 1;

    const total = users.length;
    // Já em ordem: primeiro quem acessou há pouco, por último quem está parado.
    const ordered = TIERS.flatMap((tier) => Array<ActivityTier>(totals[tier]).fill(tier));
    // Com muitos usuários, cada barra passa a representar um grupo (usa a faixa do usuário do meio do grupo).
    const groupSize = Math.max(1, Math.ceil(total / MAX_TICKS));
    const ticks = Array.from({ length: Math.ceil(total / groupSize) }, (_, index) =>
        ordered[Math.min(index * groupSize + Math.floor(groupSize / 2), total - 1)]
    );

    const recentText =
        totals.recent === 0
            ? "Ninguém acessou nos últimos 7 dias."
            : totals.recent === 1
              ? "1 acessou nos últimos 7 dias."
              : `${totals.recent.toLocaleString("pt-BR")} acessaram nos últimos 7 dias.`;

    const ariaLabel =
        `Atividade dos usuários: ${totals.recent} com acesso em até 7 dias, ` +
        `${totals.mid} entre 8 e 30 dias e ${totals.idle} há mais de 30 dias.`;

    return (
        <section
            aria-labelledby="admin-summary"
            className="overflow-hidden rounded-2xl bg-stone-800 text-background shadow-sm dark:bg-ring"
        >
            <div className="space-y-1 p-5 sm:p-6">
                <h2 id="admin-summary" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                    {total === 0 ? "Nenhum usuário cadastrado" : count(total, "usuário cadastrado", "usuários cadastrados")}
                </h2>
                {total > 0 && <p className="text-sm text-background/70">{recentText}</p>}
            </div>

            {total > 0 && (
                <>
                    <div className="px-5 sm:px-6">
                        <div role="img" aria-label={ariaLabel} className="flex h-16 items-stretch gap-[2px]">
                            {ticks.map((tier, index) => (
                                <span
                                    key={index}
                                    aria-hidden
                                    style={{ flexGrow: weightOf(index), transitionDelay: `${index * 10}ms` }}
                                    className={cn(
                                        "basis-0 origin-bottom rounded-[1px] transition-transform duration-500 ease-out motion-reduce:transition-none",
                                        TIER_STYLE[tier],
                                        shown ? "scale-y-100" : "scale-y-0"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-5 text-sm sm:p-6">
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                            {TIERS.map((tier) => (
                                <li key={tier} className="flex items-center gap-2">
                                    <span aria-hidden className={cn("size-3 rounded-[2px]", TIER_STYLE[tier])} />
                                    <span className="text-background/70">{TIER_LABEL[tier]}</span>
                                    <span className="font-semibold tabular-nums">{totals[tier].toLocaleString("pt-BR")}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-background/60 sm:ml-auto">
                            {groupSize === 1
                                ? "Cada barra é um usuário."
                                : `Cada barra reúne ${groupSize.toLocaleString("pt-BR")} usuários.`}
                        </p>
                    </div>
                </>
            )}
        </section>
    );
}

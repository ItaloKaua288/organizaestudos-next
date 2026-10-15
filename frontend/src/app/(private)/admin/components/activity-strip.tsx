"use client";

import { cn } from "@/lib/utils";
import { AdminUser } from "@/types/admin";
import { activityTier, ActivityTier, count } from "./admin-utils";

const MAX_TICKS = 72;

const TIER_STYLE: Record<ActivityTier, string> = {
    recent: "bg-primary",
    mid: "bg-primary/45",
    idle: "bg-foreground/15",
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
        <section aria-labelledby="admin-summary" className="glass rounded-3xl p-5 sm:p-7">
            <div className="space-y-1">
                <h2 id="admin-summary" className="text-2xl leading-tight font-semibold">
                    {total === 0 ? "Nenhum usuário cadastrado" : count(total, "usuário cadastrado", "usuários cadastrados")}
                </h2>
                {total > 0 && <p className="text-sm text-muted-foreground">{recentText}</p>}
            </div>

            {total > 0 && (
                <div className="mt-5 space-y-4">
                    <div role="img" aria-label={ariaLabel} className="flex h-10 items-stretch gap-[3px]">
                        {ticks.map((tier, index) => (
                            <span key={index} aria-hidden className={cn("flex-1 rounded-full", TIER_STYLE[tier])} />
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                            {TIERS.map((tier) => (
                                <li key={tier} className="flex items-center gap-2">
                                    <span aria-hidden className={cn("size-2.5 rounded-full", TIER_STYLE[tier])} />
                                    <span className="text-muted-foreground">{TIER_LABEL[tier]}</span>
                                    <span className="font-semibold tabular-nums">{totals[tier].toLocaleString("pt-BR")}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-muted-foreground sm:ml-auto">
                            {groupSize === 1
                                ? "Cada barra é um usuário."
                                : `Cada barra reúne ${groupSize.toLocaleString("pt-BR")} usuários.`}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

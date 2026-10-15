import { Account } from "@/types/user";
import { ProgressTicks } from "./progress-ticks";

const TIMEZONE = "America/Sao_Paulo";

function formatDate(value: string | null | undefined, withTime = false) {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        ...(withTime ? { timeStyle: "short" } : {}),
        timeZone: TIMEZONE,
    }).format(date);
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

/**
 * Cartão de identidade: identifica o usuário e mostra, na faixa de progresso,
 * quanto dos assuntos cadastrados já foi concluído.
 */
export function IdentityCard({ account }: { account: Account }) {
    const { stats } = account;
    const hasTopics = stats.topics > 0;
    const percent = hasTopics ? (stats.concludedTopics / stats.topics) * 100 : 0;

    return (
        <section aria-labelledby="identity-name" className="glass-strong flex flex-col gap-6 rounded-3xl p-5 sm:p-7">
            <div className="flex items-center gap-4">
                <div
                    aria-hidden
                    className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-heading text-2xl font-semibold text-primary"
                >
                    {getInitials(account.name)}
                </div>
                <h2 id="identity-name" className="min-w-0 text-2xl leading-tight font-semibold wrap-anywhere">
                    {account.name}
                </h2>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-0.5">
                    <dt className="text-muted-foreground">Membro desde</dt>
                    <dd className="font-medium">{formatDate(account.createdAt)}</dd>
                </div>
                <div className="space-y-0.5">
                    <dt className="text-muted-foreground">Último acesso</dt>
                    <dd className="font-medium">{formatDate(account.lastLogin, true)}</dd>
                </div>
            </dl>

            <div className="mt-auto space-y-3 border-t border-border pt-5">
                <ProgressTicks
                    percent={percent}
                    label={
                        hasTopics
                            ? `${stats.concludedTopics} de ${stats.topics} assuntos concluídos (${Math.round(percent)}%)`
                            : "Nenhum assunto cadastrado"
                    }
                />
                <p className="text-sm text-muted-foreground">
                    {hasTopics
                        ? `${stats.concludedTopics} de ${stats.topics} assuntos concluídos`
                        : "Cadastre assuntos nas suas matérias para acompanhar o progresso."}
                </p>
            </div>
        </section>
    );
}

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
 * Cartão do candidato: identifica o usuário e mostra, na faixa de barras,
 * quanto dos assuntos cadastrados já foi concluído.
 */
export function IdentityCard({ account }: { account: Account }) {
    const { stats } = account;
    const hasTopics = stats.topics > 0;
    const percent = hasTopics ? (stats.concludedTopics / stats.topics) * 100 : 0;

    return (
        <section
            aria-labelledby="identity-name"
            className="relative flex flex-col overflow-hidden rounded-2xl bg-stone-800 dark:bg-ring text-background shadow-sm"
        >
            <div className="space-y-5 p-5 sm:p-6">
                <div
                    aria-hidden
                    className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-primary text-3xl font-semibold text-primary-foreground sm:size-24 sm:text-4xl"
                >
                    {getInitials(account.name)}
                </div>
                <h2
                    id="identity-name"
                    className="wrap-anywhere text-2xl leading-tight font-semibold tracking-tight sm:text-3xl"
                >
                    {account.name}
                </h2>
            </div>

            <dl className="grid grid-cols-2 gap-4 px-5 pb-6 text-sm sm:px-6">
                <div className="space-y-0.5">
                    <dt className="text-background/60">Membro desde</dt>
                    <dd className="font-medium">{formatDate(account.createdAt)}</dd>
                </div>
                <div className="space-y-0.5">
                    <dt className="text-background/60">Último acesso</dt>
                    <dd className="font-medium">{formatDate(account.lastLogin, true)}</dd>
                </div>
            </dl>

            {/* Parte de baixo ancorada no fim: quando o cartão estica até a altura do resumo, a faixa fica na base. */}
            <div className="mt-auto">
                {/* Picote do cartão: linha tracejada com os dois recortes laterais. */}
                <div aria-hidden className="relative">
                    <div className="mx-5 border-t border-dashed border-background/25 sm:mx-6" />
                    <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-background" />
                    <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-background" />
                </div>

                <div className="space-y-3 p-5 sm:p-6">
                    <ProgressTicks
                        percent={percent}
                        label={
                            hasTopics
                                ? `${stats.concludedTopics} de ${stats.topics} assuntos concluídos (${Math.round(percent)}%)`
                                : "Nenhum assunto cadastrado"
                        }
                    />
                    <p className="text-sm text-background/70">
                        {hasTopics
                            ? `${stats.concludedTopics} de ${stats.topics} assuntos concluídos`
                            : "Cadastre assuntos nas suas matérias para acompanhar o progresso."}
                    </p>
                </div>
            </div>
        </section>
    );
}

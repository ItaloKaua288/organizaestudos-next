import { AccountStats } from "@/types/user";
import Link from "next/link";

type Row = {
    label: string;
    value: string;
    hint?: string;
    /** Percentual (0-100) para desenhar a barra fina da linha. */
    bar?: number;
};

const number = (value: number) => value.toLocaleString("pt-BR");

function buildRows(stats: AccountStats): Row[] {
    const accuracy = stats.questionsTotal > 0 ? (stats.questionsCorrect / stats.questionsTotal) * 100 : null;

    return [
        { label: "Perfis de estudo", value: number(stats.profiles) },
        {
            label: "Matérias",
            value: number(stats.subjects),
            hint: stats.subjects !== stats.activeSubjects ? `${number(stats.activeSubjects)} ativas` : undefined,
        },
        {
            label: "Assuntos",
            value: number(stats.topics),
            hint: stats.topics > 0 ? `${number(stats.concludedTopics)} concluídos` : undefined,
        },
        { label: "Notas", value: number(stats.notes) },
        {
            label: "Questões resolvidas",
            value: number(stats.questionsTotal),
            hint: stats.questionsTotal > 0 ? `${number(stats.questionsCorrect)} acertos` : undefined,
        },
        accuracy === null
            ? { label: "Aproveitamento", value: "—", hint: "Registre questões para ver seu aproveitamento." }
            : { label: "Aproveitamento", value: `${accuracy.toFixed(1).replace(".", ",")}%`, bar: accuracy },
    ];
}

/** Resumo dos estudos em linhas, somando todos os perfis de estudo. */
export function StudyLedger({ stats }: { stats: AccountStats }) {
    const rows = buildRows(stats);

    return (
        <section aria-labelledby="ledger-title" className="flex flex-col">
            <h2 id="ledger-title" className="text-lg font-semibold">
                Resumo dos estudos
            </h2>
            <p className="text-sm text-muted-foreground">Soma de todos os seus perfis de estudo.</p>

            <dl className="mt-4 divide-y border-y">
                {rows.map((row) => (
                    <div key={row.label} className="py-3.5">
                        <div className="flex items-baseline justify-between gap-4">
                            <dt className="text-sm text-muted-foreground">{row.label}</dt>
                            <dd className="text-2xl font-semibold tabular-nums">{row.value}</dd>
                        </div>
                        {row.hint && <p className="mt-0.5 text-right text-xs text-muted-foreground">{row.hint}</p>}
                        {row.bar !== undefined && (
                            <div aria-hidden className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${row.bar}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </dl>

            <Link
                href="/desempenho"
                className="mt-4 self-start rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                Ver desempenho por matéria
            </Link>
        </section>
    );
}

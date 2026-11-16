import { Badge } from "@/components/ui/badge";
import { getSubjectStats } from "@/lib/subject-stats";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { CheckCircle2, ChevronRight, Plus, RotateCw } from "lucide-react";
import Link from "next/link";

type SubjectLinkCardProps = {
    subject: Subject & { topics: Topic[] };
};

/** Card compacto da matéria: ao clicar abre a página de detalhes (/materias/[id]). */
export default function SubjectLinkCard({ subject }: SubjectLinkCardProps) {
    const isActive = subject.active !== false;
    const { total, done, pending, percent, dueReviews } = getSubjectStats(subject.topics);
    const isEmpty = total === 0;
    const isComplete = total > 0 && pending === 0;

    return (
        <Link
            href={`/materias/${subject.id}`}
            aria-label={`Abrir a matéria ${subject.title}`}
            className="glass group flex flex-col gap-3 rounded-2xl p-4 transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none sm:p-5"
        >
            <div className="flex items-center justify-between gap-2">
                <div className={`flex min-w-0 items-center gap-2.5 ${isActive ? "" : "opacity-70"}`}>
                    <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                    />
                    <h2 className="truncate text-base font-semibold" title={subject.title}>{subject.title}</h2>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {isActive && dueReviews > 0 && (
                        <span
                            className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium tabular-nums text-primary"
                            title={`${dueReviews} ${dueReviews === 1 ? "revisão" : "revisões"} para hoje ou atrasada${dueReviews === 1 ? "" : "s"}`}
                        >
                            <RotateCw size={11} aria-hidden="true" />
                            {dueReviews} {dueReviews === 1 ? "revisão" : "revisões"}
                        </span>
                    )}
                    <ChevronRight
                        size={17}
                        className="text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden="true"
                    />
                </div>
            </div>

            {!isActive ? (
                <div className="flex items-center gap-2 opacity-70">
                    <Badge variant="secondary">Desativada</Badge>
                </div>
            ) : isEmpty ? (
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Sem assuntos ainda</span>
                    <span className="flex items-center gap-1 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                        <Plus size={13} aria-hidden="true" /> Adicionar assuntos
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{total === 1 ? "1 assunto" : `${total} assuntos`}</span>
                        {isComplete ? (
                            <span className="flex items-center gap-1 font-medium text-emerald-500">
                                <CheckCircle2 size={14} aria-hidden="true" />
                                {total === 1 ? "Concluído" : "Tudo concluído"}
                            </span>
                        ) : (
                            <span>
                                <span className="font-medium text-foreground">
                                    {pending} {pending === 1 ? "pendente" : "pendentes"}
                                </span>
                                {" · "}
                                {percent}%
                            </span>
                        )}
                    </div>
                    {!isComplete && (
                        <div
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={total}
                            aria-valuenow={done}
                            aria-valuetext={`${done} de ${total} assuntos concluídos`}
                            aria-label={`Progresso de ${subject.title}`}
                            className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
                        >
                            <div
                                className="h-full rounded-full transition-[width] duration-300"
                                style={{ width: `${percent}%`, backgroundColor: subject.color }}
                            />
                        </div>
                    )}
                </div>
            )}
        </Link>
    );
}

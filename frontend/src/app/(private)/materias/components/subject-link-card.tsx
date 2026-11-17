import { Badge } from "@/components/ui/badge";
import { getSubjectStats } from "@/lib/subject-stats";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { CheckCircle2, ChevronRight, Plus, RotateCw } from "lucide-react";
import Link from "next/link";
import { SubjectCardActions } from "./subject-card-actions";

type SubjectLinkCardProps = {
    subject: Subject & { topics: Topic[] };
    /** Reserva espaço à esquerda para a alça de arrastar (posicionada pelo pai). */
    withDragHandle?: boolean;
};

/** Card compacto da matéria: ao clicar abre a página de detalhes (/materias/[id]). */
export default function SubjectLinkCard({ subject, withDragHandle = false }: SubjectLinkCardProps) {
    const isActive = subject.active !== false;
    const { total, done, pending, percent, dueReviews } = getSubjectStats(subject.topics);
    const isEmpty = total === 0;
    const isComplete = total > 0 && pending === 0;

    return (
        // O link cobre o card inteiro (camada de baixo); o conteúdo ignora o mouse e só as ações
        // (editar/excluir/etc.) recebem cliques, assim os botões nunca ficam dentro do <a>.
        <div
            className={`glass group relative flex flex-col gap-3 rounded-2xl p-4 transition-all duration-150 focus-within:ring-3 focus-within:ring-ring/40 hover:-translate-y-0.5 sm:p-5 ${withDragHandle ? "pl-10 sm:pl-11" : ""}`}
        >
            <Link
                href={`/materias/${subject.id}`}
                aria-label={`Abrir a matéria ${subject.title}`}
                className="absolute inset-0 rounded-2xl focus-visible:outline-none"
            />

            <div className="pointer-events-none relative flex items-center justify-between gap-2">
                <div className={`flex min-w-0 items-center gap-2.5 ${isActive ? "" : "opacity-70"}`}>
                    <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                    />
                    <h2 className="truncate text-base font-semibold" title={subject.title}>{subject.title}</h2>
                </div>

                <div className="grid shrink-0 items-center justify-items-end">
                    {/* Indicadores: somem ao passar o mouse para dar lugar às ações */}
                    <div className="col-start-1 row-start-1 flex items-center gap-2 transition-opacity duration-150 [@media(hover:hover)]:group-focus-within:opacity-0 [@media(hover:hover)]:group-hover:opacity-0">
                        {isActive && dueReviews > 0 && (
                            <span
                                className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium tabular-nums text-primary"
                                title={`${dueReviews} ${dueReviews === 1 ? "revisão" : "revisões"} para hoje ou atrasada${dueReviews === 1 ? "" : "s"}`}
                            >
                                <RotateCw size={11} aria-hidden="true" />
                                {dueReviews} {dueReviews === 1 ? "revisão" : "revisões"}
                            </span>
                        )}
                        <ChevronRight size={17} className="text-muted-foreground" aria-hidden="true" />
                    </div>

                    {/* Ações: aparecem ao passar o mouse (ou ao focar por teclado) em telas com mouse */}
                    <div className="pointer-events-none col-start-1 row-start-1 opacity-0 transition-opacity duration-150 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100">
                        <SubjectCardActions subject={subject} />
                    </div>
                </div>
            </div>

            {!isActive ? (
                <div className="pointer-events-none relative flex items-center gap-2 opacity-70">
                    <Badge variant="secondary">Desativada</Badge>
                </div>
            ) : isEmpty ? (
                <div className="pointer-events-none relative flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Sem assuntos ainda</span>
                    <span className="flex items-center gap-1 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                        <Plus size={13} aria-hidden="true" /> Adicionar assuntos
                    </span>
                </div>
            ) : (
                <div className="pointer-events-none relative flex flex-col gap-1.5">
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
        </div>
    );
}

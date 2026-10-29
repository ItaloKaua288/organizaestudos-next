import { Badge } from "@/components/ui/badge";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type SubjectLinkCardProps = {
    subject: Subject & { topics: Topic[] };
};

/** Card compacto da matéria: ao clicar abre a página de detalhes (/materias/[id]). */
export default function SubjectLinkCard({ subject }: SubjectLinkCardProps) {
    const isActive = subject.active !== false;

    // Assuntos que têm subassuntos são só organizadores: não entram na contagem.
    const countable = subject.topics.filter((topic) => !topic.isContainer);
    const total = countable.length;
    const done = countable.filter((topic) => topic.status === "CONCLUIDO").length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

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
                <ChevronRight
                    size={17}
                    className="shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden="true"
                />
            </div>

            {isActive ? (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{total === 1 ? "1 assunto" : `${total} assuntos`}</span>
                        <span>{done}/{total} concluídos</span>
                    </div>
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        aria-label={`Progresso de ${subject.title}`}
                        className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
                    >
                        <div
                            className="h-full rounded-full transition-[width] duration-300"
                            style={{ width: `${percent}%`, backgroundColor: subject.color }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 opacity-70">
                    <Badge variant="secondary">Desativada</Badge>
                </div>
            )}
        </Link>
    );
}

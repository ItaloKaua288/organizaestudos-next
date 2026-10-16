"use client";

import { openTopicAttachmentAction } from "@/actions/topics.actions";
import { getQuestionStatsAction } from "@/actions/questions.actions";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { QuestionTopicStat } from "@/types/question";
import type { Topic, TopicStatus } from "@/types/topic";
import { BookText, Check, ExternalLink, FileText, Link2, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KANBAN_COLUMNS } from "./kanban-config";
import { getOwnTitle, getReviewTimeline, type ReviewTone } from "./kanban-utils";

const NODE_STYLE: Record<ReviewTone, string> = {
    done: "bg-emerald-500 text-white",
    late: "bg-destructive/15 ring-2 ring-destructive",
    today: "bg-primary ring-4 ring-primary/25",
    upcoming: "ring-2 ring-foreground/25",
};

const TEXT_STYLE: Record<ReviewTone, string> = {
    done: "text-emerald-700 dark:text-emerald-400",
    late: "text-destructive",
    today: "font-medium text-primary",
    upcoming: "text-muted-foreground",
};

type KanbanTopicSheetProps = {
    /** Assunto aberto. Fica no último valor enquanto o painel fecha, para o conteúdo não sumir na animação. */
    topic: Topic | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMove: (topic: Topic, to: TopicStatus) => void;
};

export function KanbanTopicSheet({ topic, open, onOpenChange, onMove }: KanbanTopicSheetProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Centralizado na tela; o cabeçalho e o rodapé ficam fixos e só o miolo rola. */}
            <DialogContent className="flex flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
                {topic && <TopicDetail key={topic.id} topic={topic} onMove={onMove} />}
            </DialogContent>
        </Dialog>
    );
}

function TopicDetail({ topic, onMove }: { topic: Topic; onMove: (topic: Topic, to: TopicStatus) => void }) {
    const title = getOwnTitle(topic);
    const subject = topic.subject;

    return (
        <>
            <DialogHeader
                className="shrink-0 gap-3 px-5 pt-5 pb-4"
                style={{ backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, ${subject.color} 20%, transparent), transparent)` }}
            >
                <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="truncate">{topic.parentTitle ? `${subject.title} › ${topic.parentTitle}` : subject.title}</span>
                </p>

                <DialogTitle className="text-xl leading-snug wrap-break-word">{title}</DialogTitle>
                <DialogDescription className="sr-only">Detalhes do assunto: situação, revisões, material de estudo e questões.</DialogDescription>

                <StatusControl topic={topic} onMove={onMove} />
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-5">
                <ReviewsSection topic={topic} />
                <MaterialSection topic={topic} />
                <QuestionsSection topicId={topic.id} />
            </div>

            <footer className="flex shrink-0 flex-wrap gap-2 border-t px-5 py-4">
                <Link href={`/materias/${subject.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <BookText aria-hidden />
                    Abrir matéria
                </Link>
                <Link href={`/notas/${subject.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <NotebookPen aria-hidden />
                    Anotações da matéria
                </Link>
            </footer>
        </>
    );
}

/** Mesma troca de coluna do quadro, agora a um toque do painel. */
function StatusControl({ topic, onMove }: { topic: Topic; onMove: (topic: Topic, to: TopicStatus) => void }) {
    return (
        <div role="group" aria-label="Situação do assunto" className="grid grid-cols-3 gap-1 rounded-xl bg-foreground/6 p-1">
            {KANBAN_COLUMNS.map((column) => {
                const selected = column.status === topic.status;
                const Icon = column.icon;

                return (
                    <button
                        key={column.status}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onMove(topic, column.status)}
                        className={cn(
                            "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                            selected
                                ? cn("font-medium shadow-[inset_0_1px_0_var(--glass-edge)] ring-1 ring-(--glass-ring)", column.tone)
                                : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                        )}
                    >
                        <Icon className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{column.title}</span>
                    </button>
                );
            })}
        </div>
    );
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">{children}</h3>
            {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
        </div>
    );
}

function ReviewsSection({ topic }: { topic: Topic }) {
    if (topic.status !== "CONCLUIDO") {
        return (
            <section>
                <SectionTitle>Revisões</SectionTitle>
                <p className="text-sm text-balance text-muted-foreground">
                    {topic.status === "ESTUDANDO"
                        ? "Ao concluir este assunto, as revisões de 1, 7 e 30 dias são agendadas."
                        : "Depois de estudar e concluir, as revisões de 1, 7 e 30 dias são agendadas aqui."}
                </p>
            </section>
        );
    }

    const steps = getReviewTimeline(topic);
    const done = steps.filter((step) => step.concluded).length;

    return (
        <section>
            <SectionTitle aside={`${done} de 3 feitas`}>Revisões</SectionTitle>

            <ol className="flex flex-col">
                {steps.map((step, index) => (
                    <li key={step.number} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < steps.length - 1 && (
                            <span
                                aria-hidden
                                className={cn("absolute top-6 bottom-0 left-[9.5px] w-px", step.concluded ? "bg-emerald-500/60" : "bg-foreground/15")}
                            />
                        )}
                        <span aria-hidden className={cn("relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", NODE_STYLE[step.tone])}>
                            {step.concluded && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-sm font-medium">{step.number}ª revisão</p>
                                <p className="shrink-0 text-xs text-muted-foreground">após {step.interval}</p>
                            </div>
                            <p className={cn("text-xs", TEXT_STYLE[step.tone])}>
                                {step.relative}
                                {step.dateText && !step.concluded ? `, ${step.dateText}` : ""}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>

            {done < 3 && (
                <Link href="/revisoes" className="mt-3 inline-block rounded-md text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                    Ir para Revisões
                </Link>
            )}
        </section>
    );
}

/** Só devolve o endereço se for http(s): um `javascript:` salvo como link não pode virar href. */
function parseSafeUrl(value: string | null | undefined): URL | null {
    if (!value) return null;

    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch {
        return null;
    }
}

function MaterialSection({ topic }: { topic: Topic }) {
    const url = parseSafeUrl(topic.link);
    const attachments = topic.attachments ?? [];
    const empty = !url && attachments.length === 0;

    async function openAttachment(publicId: string) {
        const newTab = window.open("about:blank", "_blank");
        const toastId = "kanban-open-attachment";

        try {
            toast.loading("Abrindo anexo...", { id: toastId });
            const formData = new FormData();
            formData.append("topicId", topic.id);
            formData.append("public_id", publicId);

            const blob = (await openTopicAttachmentAction(formData)).blob;

            if (blob && newTab) {
                const objectUrl = URL.createObjectURL(blob);
                newTab.location.href = objectUrl;
                toast.success("Anexo aberto", { id: toastId });
                setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
            } else {
                newTab?.close();
                toast.error("Falha ao abrir o anexo", { id: toastId });
            }
        } catch {
            newTab?.close();
            toast.error("Falha ao abrir o anexo", { id: toastId });
        }
    }

    return (
        <section>
            <SectionTitle aside={attachments.length > 0 ? `${attachments.length} ${attachments.length === 1 ? "anexo" : "anexos"}` : undefined}>
                Material de estudo
            </SectionTitle>

            {empty ? (
                <p className="text-sm text-balance text-muted-foreground">
                    Nenhum link ou anexo neste assunto. Você pode adicioná-los em{" "}
                    <Link href={`/materias/${topic.subject.id}`} className="rounded-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                        Matérias
                    </Link>
                    .
                </p>
            ) : (
                <div className="-mx-2 flex min-w-0 flex-col gap-0.5">
                    {url && (
                        <a
                            href={url.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors outline-none hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            <Link2 className="size-4 shrink-0 text-primary" aria-hidden />
                            <span className="min-w-0 flex-1">
                                <span className="block">Link do assunto</span>
                                <span className="block truncate text-xs text-muted-foreground">{url.hostname.replace(/^www\./, "")}</span>
                            </span>
                            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="sr-only">(abre em outra aba)</span>
                        </a>
                    )}

                    {attachments.map((attachment) => (
                        <button
                            key={attachment.id}
                            type="button"
                            disabled={!attachment.public_id}
                            onClick={() => attachment.public_id && openAttachment(attachment.public_id)}
                            className="flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors outline-none hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FileText className="size-4 shrink-0" style={{ color: topic.subject.color }} aria-hidden />
                            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

type QuestionsState = { phase: "loading" } | { phase: "error" } | { phase: "ready"; stat: QuestionTopicStat | null };

function QuestionsSection({ topicId }: { topicId: string }) {
    const [state, setState] = useState<QuestionsState>({ phase: "loading" });

    // O painel é remontado a cada assunto (key), então o estado começa sempre em "loading".
    useEffect(() => {
        let cancelled = false;

        getQuestionStatsAction()
            .then((stats) => {
                if (cancelled) return;
                const stat = stats.subjects.flatMap((subject) => subject.topics).find((item) => item.id === topicId) ?? null;
                setState({ phase: "ready", stat });
            })
            .catch(() => {
                if (!cancelled) setState({ phase: "error" });
            });

        return () => {
            cancelled = true;
        };
    }, [topicId]);

    return (
        <section aria-busy={state.phase === "loading"}>
            <SectionTitle>Questões</SectionTitle>

            {state.phase === "loading" && (
                <div className="space-y-2" aria-label="Carregando questões">
                    <div className="h-2 w-full animate-pulse rounded-full bg-foreground/10" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
                </div>
            )}

            {state.phase === "error" && <p className="text-sm text-muted-foreground">Não foi possível carregar o desempenho deste assunto.</p>}

            {state.phase === "ready" && (!state.stat || state.stat.total === 0) && (
                <p className="text-sm text-balance text-muted-foreground">
                    Nenhuma questão registrada neste assunto. Registre em{" "}
                    <Link href="/desempenho" className="rounded-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                        Desempenho
                    </Link>
                    .
                </p>
            )}

            {state.phase === "ready" && state.stat && state.stat.total > 0 && <QuestionSummary stat={state.stat} />}
        </section>
    );
}

function QuestionSummary({ stat }: { stat: QuestionTopicStat }) {
    const lastDate = stat.lastAnsweredAt
        ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" }).format(new Date(stat.lastAnsweredAt))
        : null;

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-semibold tabular-nums">{Math.round(stat.percent)}%</span>
                <span className="text-sm text-muted-foreground">de acerto</span>
            </div>

            <div
                role="img"
                aria-label={`${stat.correct} acertos e ${stat.wrong} erros`}
                className="flex h-2 overflow-hidden rounded-full bg-destructive/25"
            >
                <span className="bg-primary" style={{ width: `${stat.percent}%` }} />
            </div>

            <p className="text-sm text-muted-foreground">
                {stat.correct} {stat.correct === 1 ? "acerto" : "acertos"} e {stat.wrong} {stat.wrong === 1 ? "erro" : "erros"} em {stat.total}{" "}
                {stat.total === 1 ? "questão" : "questões"}, somando {stat.sessions} {stat.sessions === 1 ? "sessão" : "sessões"}.
                {lastDate ? ` Última em ${lastDate}.` : ""}
            </p>
        </div>
    );
}

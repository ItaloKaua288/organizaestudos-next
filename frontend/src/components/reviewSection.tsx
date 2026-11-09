"use client";

import { describeFailure, toastError } from "@/lib/toast-feedback";
import { changeReviewStatus, redistributeMonthlyReviewsAction, ReviewPerformance } from "@/actions/review.actions";
import { DialogDemo } from "@/components/dialog-button";
import { updateTopicAction } from "@/actions/topics.actions";
import { KanbanTopicSheet } from "@/app/(private)/kanban/components/kanban-topic-sheet";
import { OverdueBadge } from "@/components/overdue-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getTodayBR } from "@/lib/date";
import { Topic, TopicStatus } from "@/types/topic";
import { CalendarRange, CheckCircle2, ChevronRight, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";

interface ReviewSectionProps {
    title: string;
    icon: React.ReactNode;
    reviewIndex?: number;
    topics: Topic[];
}

interface ReviewItemProps {
    item: Topic;
    reviewIndex?: number;
}

// Avaliação ao concluir uma revisão: errou volta antes, acertou espaça mais.
const PERFORMANCE_OPTIONS: { value: ReviewPerformance; label: string; hint: string; className: string }[] = [
    { value: "ERROU", label: "Muito difícil", hint: "Revisar de novo em breve", className: "hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300" },
    { value: "DIFICIL", label: "Difícil", hint: "Voltar um pouco antes", className: "hover:border-orange-500/40 hover:bg-orange-500/15 hover:text-orange-700 dark:hover:text-orange-300" },
    { value: "BOM", label: "Bom", hint: "Intervalo padrão", className: "hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300" },
    { value: "FACIL", label: "Fácil", hint: "Espaçar mais", className: "hover:border-blue-500/40 hover:bg-blue-500/15 hover:text-blue-700 dark:hover:text-blue-300" },
];

// Espelha as regras do backend (topic.controller.js): em quantos dias a próxima revisão aparece.
const NEXT_REVIEW_DAYS: Record<1 | 2, Record<ReviewPerformance, number>> = {
    1: { ERROU: 2, DIFICIL: 4, BOM: 7, FACIL: 12 },
    2: { ERROU: 7, DIFICIL: 15, BOM: 30, FACIL: 45 },
};
const RECURRING_FACTOR: Record<ReviewPerformance, number> = { ERROU: 0.3, DIFICIL: 0.6, BOM: 1.5, FACIL: 2.5 };
const RECURRING_MIN_DAYS = 7;
const RECURRING_MAX_DAYS = 180;
const DEFAULT_RECURRING_DAYS = 30;

// Dias até a próxima revisão para cada avaliação; null quando a avaliação não reagenda nada.
function getNextReviewDays(item: Topic, reviewIndex: number, performance: ReviewPerformance): number | null {
    if (reviewIndex === 3) {
        const current = item.reviewInterval || DEFAULT_RECURRING_DAYS;
        const next = Math.round(current * RECURRING_FACTOR[performance]);
        return Math.min(RECURRING_MAX_DAYS, Math.max(RECURRING_MIN_DAYS, next));
    }

    if (reviewIndex === 1 || reviewIndex === 2) {
        const target = reviewIndex === 1 ? item.reviews.second : item.reviews.third;
        if (target.concluded) return null;
        return NEXT_REVIEW_DAYS[reviewIndex][performance];
    }

    return null;
}

const formatDays = (days: number) => `em ${days} ${days === 1 ? "dia" : "dias"}`;

const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

export function ReviewItem({ item, reviewIndex }: ReviewItemProps) {
    const [isPending, startTransition] = useTransition();
    const [isRating, setIsRating] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const isConcludedSection = !reviewIndex;

    const getReviewTimeStatus = () => {
        if (isConcludedSection) return null;

        const reviewDateStr =
            reviewIndex === 1 ? item.reviews.first.date :
                reviewIndex === 2 ? item.reviews.second.date :
                    item.reviews.third.date;

        const reviewDate = new Date(reviewDateStr);
        reviewDate.setUTCHours(0, 0, 0, 0);

        const now = getTodayBR();

        const diffMs = reviewDate.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <OverdueBadge days={-diffDays} />;
        } else if (diffDays === 0) {
            return <Badge variant="default">Hoje</Badge>;
        } else if (diffDays === 1) {
            return <span className="text-xs text-muted-foreground">Amanhã</span>;
        } else {
            return <span className="text-xs text-muted-foreground">Em {diffDays} dias</span>;
        }
    };

    const concludeWith = (performance: ReviewPerformance) => {
        if (!reviewIndex || isPending) return;

        startTransition(async () => {
            const toastId = "conclude-review";
            const retry = () => concludeWith(performance);

            try {
                const reviewKey = `review${reviewIndex}`
                toast.loading("Concluindo revisão...", { id: toastId });
                const result = await changeReviewStatus(item.id, reviewKey, true, performance);

                if (!result.success) {
                    toastError(describeFailure("Não foi possível concluir a revisão", result.error), { id: toastId, retry });
                    return;
                }

                setIsRating(false);
                toast.success(
                    result.nextReview
                        ? `Revisão concluída! Próxima em ${result.nextReview.days} dias (${formatShortDate(result.nextReview.date)}).`
                        : "Revisão concluída!",
                    { id: toastId }
                );
            } catch (error) {
                toastError(describeFailure("Erro ao concluir a revisão", error), { id: toastId, retry });
            }
        });
    };

    const handleConclude = (e: React.MouseEvent, performance: ReviewPerformance) => {
        e.stopPropagation();
        concludeWith(performance);
    };

    // Atalhos 1 a 4 (Muito difícil, Difícil, Bom, Fácil), válidos depois de abrir a avaliação em "Feito".
    const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isConcludedSection || e.ctrlKey || e.metaKey || e.altKey) return;

        const target = e.target as HTMLElement;
        if (target.closest("input, textarea, select, [contenteditable='true']")) return;

        const option = PERFORMANCE_OPTIONS[Number(e.key) - 1];
        if (!option) return;

        if (!isRating) return;

        e.preventDefault();
        concludeWith(option.value);
    };

    // Passar o mouse sobre a linha leva o foco até ela, para os atalhos funcionarem sem clicar antes.
    const handleRowMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isConcludedSection) return;
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body || active.hasAttribute("data-review-row")) {
            e.currentTarget.focus({ preventScroll: true });
        }
    };

    // Clique na linha abre os detalhes; botões e a avaliação da revisão seguem com o próprio comportamento.
    const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (!e.currentTarget.contains(target)) return;
        const interactive = target.closest("button, a, select, input, label");
        if (interactive && !interactive.hasAttribute("data-topic-open")) return;
        setIsInfoOpen(true);
    };

    const handleStatusChange = async (topic: Topic, newStatus: TopicStatus) => {
        if (newStatus === topic.status) return;

        const toastId = "update-status-topic";

        try {
            toast.loading("Atualizando status do assunto...", { id: toastId });
            const formData = new FormData();
            formData.append("topicId", topic.id);
            formData.append("title", topic.title);
            formData.append("link", topic.link || "");
            formData.append("review1", topic.reviews.first.date);
            formData.append("status", newStatus);
            await updateTopicAction(formData);
            toast.success("Status do assunto atualizado!", { id: toastId });
        } catch (error) {
            toastError(describeFailure("Falha ao atualizar o status", error), {
                id: toastId,
                retry: () => void handleStatusChange(topic, newStatus),
            });
        }
    };

    return (
        <div className="block w-full">
                    <div
                        onClick={handleRowClick}
                        onKeyDown={handleRowKeyDown}
                        onMouseEnter={handleRowMouseEnter}
                        tabIndex={isConcludedSection ? undefined : 0}
                        data-review-row={isConcludedSection ? undefined : ""}
                        className="group/row flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border-b px-3 py-3 transition-colors duration-150 outline-none hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        <div className="flex-1 min-w-0 text-sm flex items-center gap-2.5">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.subject.color }}
                        title={item.subject.title}
                        aria-hidden="true"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                        <button
                            type="button"
                            data-topic-open=""
                            aria-haspopup="dialog"
                            aria-label={`Ver informações de ${item.title}`}
                            className="cursor-pointer truncate rounded-md text-start font-medium text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            {item.title}
                        </button>
                        <span className="mt-0.5 truncate text-start text-xs text-muted-foreground">
                            {item.subject.title}
                        </span>
                    </div>
                    {/* Deixa claro que a linha inteira abre os detalhes. */}
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-foreground"
                    />
                        </div>

                        {!isConcludedSection && (
                    <>
                        {getReviewTimeStatus()}
                        <Button
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => { e.stopPropagation(); setIsRating((v) => !v); }}
                            disabled={isPending}
                            aria-expanded={isRating}
                        >
                            {isPending ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                            ) : (
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            )}
                            {isPending ? "Salvando..." : "Feito"}
                        </Button>
                    </>
                        )}

                        {!isConcludedSection && isRating && (
                    <div className="w-full flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-muted-foreground">Como foi essa revisão? Isso ajusta a data da próxima. Atalho: teclas 1 a 4.</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {PERFORMANCE_OPTIONS.map((option) => {
                                const days = reviewIndex ? getNextReviewDays(item, reviewIndex, option.value) : null;

                                return (
                                <Button
                                    key={option.value}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    title={option.hint}
                                    disabled={isPending}
                                    onClick={(e) => handleConclude(e, option.value)}
                                    className={cn("h-auto flex-col gap-0 py-1.5", option.className)}
                                >
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs font-normal text-muted-foreground transition-colors group-hover/button:text-current group-hover/button:opacity-80">{option.hint}</span>
                                    {days !== null && (
                                        <span className="mt-1 rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-semibold text-foreground transition-colors group-hover/button:bg-current/15 group-hover/button:text-current">
                                            {formatDays(days)}
                                        </span>
                                    )}
                                </Button>
                                );
                            })}
                        </div>
                    </div>
                        )}
                    </div>
            <KanbanTopicSheet topic={item} open={isInfoOpen} onOpenChange={setIsInfoOpen} onMove={handleStatusChange} manage />
        </div>
    );
}

function OrganizeMonthButton() {
    const [isPending, setIsPending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleOrganize = async () => {
        const toastId = "organize-reviews";

        try {
            setIsPending(true);
            toast.loading("Organizando revisões...", { id: toastId });

            const result = await redistributeMonthlyReviewsAction();

            if (result.success) {
                toast.success(
                    result.updated > 0 ? `${result.updated} revisões organizadas!` : result.message,
                    { id: toastId }
                );
                setIsOpen(false);
            } else {
                toastError(describeFailure("Não foi possível organizar as revisões", result.message), { id: toastId, retry: () => void handleOrganize() });
            }
        } catch (error) {
            console.error("Falha ao organizar revisões", error);
            toastError(describeFailure("Falha ao organizar as revisões", error), { id: toastId, retry: () => void handleOrganize() });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <DialogDemo
            title="Organizar revisões de 30 dias"
            description="As revisões de 30 dias serão distribuídas de hoje até daqui a 30 dias, com o menor número possível de revisões por dia, mantendo a ordem atual."
            contentBtn={
                <>
                    <CalendarRange className="mr-1 h-3.5 w-3.5" />
                    Organizar
                </>
            }
            classNameBtn="h-8 text-xs"
            nameConfirmBtn={isPending ? "Organizando..." : "Organizar"}
            open={isOpen}
            onOpenChange={setIsOpen}
            onSubmit={(e) => {
                e.preventDefault();
                handleOrganize();
            }}
        />
    );
}

export function ReviewSection({ title, icon, reviewIndex, topics }: ReviewSectionProps) {
    const hasTopics = topics && topics.length > 0;

    return (
        <section className="glass rounded-2xl p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2.5">
                <span className="text-muted-foreground">{icon}</span>
                <h2 className="text-lg font-semibold">{title}</h2>
                <div className="ml-auto flex items-center gap-2">
                    {reviewIndex === 3 && hasTopics && <OrganizeMonthButton />}
                    <Badge variant="secondary">{topics?.length || 0}</Badge>
                </div>
            </div>

            {!hasTopics ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma revisão neste período. Quando houver, ela aparece aqui.
                </p>
            ) : (
                <div className="flex w-full flex-col ">
                    {topics.map((item, index) => (
                        <div key={item.id || index} className="py-1 first:pt-0 last:pb-0">
                            <ReviewItem item={item} reviewIndex={reviewIndex} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export function ReviewSectionSkeleton() {
    const sections = [
        { title: "1° Revisão", icon: <Clock size={20} /> },
        { title: "2° Revisão", icon: <Clock size={20} /> },
        { title: "3° Revisão", icon: <Clock size={20} /> },
        { title: "Concluído", icon: <CheckCircle2 size={20} /> },
    ];

    return (
        <>
            {sections.map((sec, index) => (
                <section className="glass rounded-2xl p-4 sm:p-5" key={index}>
                    <div className="mb-2 flex items-center gap-2.5">
                        <span className="text-muted-foreground">{sec.icon}</span>
                        <h2 className="text-lg font-semibold">{sec.title}</h2>
                        <span className="ml-auto">
                            <Spinner />
                        </span>
                    </div>

                    <div className="flex w-full flex-col divide-y divide-border">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 px-3 py-3">
                                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                                <div className="flex w-full flex-col gap-1.5">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </>
    );
}

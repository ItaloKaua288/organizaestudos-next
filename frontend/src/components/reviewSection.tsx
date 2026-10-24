"use client";

import { changeReviewStatus, redistributeMonthlyReviewsAction, ReviewPerformance } from "@/actions/review.actions";
import { DialogDemo } from "@/components/dialog-button";
import { updateTopicAction } from "@/actions/topics.actions";
import { KanbanTopicSheet } from "@/app/(private)/kanban/components/kanban-topic-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getTodayBR } from "@/lib/date";
import { Topic, TopicStatus } from "@/types/topic";
import { CalendarRange, CheckCircle2, Clock, Loader2 } from "lucide-react";
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
    { value: "ERROU", label: "Muito difícil", hint: "Revisar de novo em breve", className: "hover:bg-destructive/10 hover:text-destructive" },
    { value: "DIFICIL", label: "Difícil", hint: "Voltar um pouco antes", className: "hover:bg-foreground/8" },
    { value: "BOM", label: "Bom", hint: "Intervalo padrão", className: "hover:bg-primary/10 hover:text-primary" },
    { value: "FACIL", label: "Fácil", hint: "Espaçar mais", className: "hover:bg-foreground/8" },
];

const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

function ReviewItem({ item, reviewIndex }: ReviewItemProps) {
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
            return <Badge variant="destructive">Atrasado {-diffDays}d</Badge>;
        } else if (diffDays === 0) {
            return <Badge variant="default">Hoje</Badge>;
        } else if (diffDays === 1) {
            return <span className="text-xs text-muted-foreground">Amanhã</span>;
        } else {
            return <span className="text-xs text-muted-foreground">Em {diffDays} dias</span>;
        }
    };

    const handleConclude = (e: React.MouseEvent, performance: ReviewPerformance) => {
        e.stopPropagation();
        if (!reviewIndex) return;

        startTransition(async () => {
            try {
                const reviewKey = `review${reviewIndex}`
                toast.loading("Concluindo revisão...", { id: "conclude-review" });
                const result = await changeReviewStatus(item.id, reviewKey, true, performance);

                if (!result.success) {
                    toast.error("Erro ao concluir revisão.", { id: "conclude-review" });
                    return;
                }

                setIsRating(false);
                toast.success(
                    result.nextReview
                        ? `Revisão concluída! Próxima em ${result.nextReview.days} dias (${formatShortDate(result.nextReview.date)}).`
                        : "Revisão concluída!",
                    { id: "conclude-review" }
                );
            } catch {
                toast.error("Erro ao concluir revisão.", { id: "conclude-review" });
            }
        });
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
        } catch {
            toast.error("Falha ao atualizar o status.", { id: toastId });
        }
    };

    return (
        <div className="block w-full">
                    <div
                        onClick={handleRowClick}
                        className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border-b px-3 py-3 transition-colors duration-150 hover:bg-foreground/6"
                    >
                        <div className="flex-1 min-w-0 text-sm flex items-center gap-2.5">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.subject.color }}
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
                        <span className="text-xs text-muted-foreground">Como foi essa revisão? Isso ajusta a data da próxima.</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {PERFORMANCE_OPTIONS.map((option) => (
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
                                    <span className="text-xs font-normal text-muted-foreground">{option.hint}</span>
                                </Button>
                            ))}
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
                toast.error(result.message, { id: toastId });
            }
        } catch (error) {
            console.error("Falha ao organizar revisões", error);
            toast.error("Falha ao organizar as revisões", { id: toastId });
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

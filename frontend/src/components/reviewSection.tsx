"use client";

import { changeReviewStatus } from "@/actions/review.actions";
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getTodayBR } from "@/lib/date";
import { Topic } from "@/types/topic";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useTransition } from "react";
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

function ReviewItem({ item, reviewIndex }: ReviewItemProps) {
    const [isPending, startTransition] = useTransition();
    const hasAttachments = Boolean(item.attachments && item.attachments.length > 0);
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
            return <Badge variant="destructive">Atrasado</Badge>;
        } else if (diffDays === 0) {
            return <Badge variant="default">Hoje</Badge>;
        } else if (diffDays === 1) {
            return <div className="text-xs text-muted-foreground">Amanhã</div>;
        } else {
            return <div className="text-xs text-muted-foreground">Em {diffDays} dias</div>;
        }
    };

    const handleConclude = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!reviewIndex) return;

        startTransition(async () => {
            try {
                const reviewKey = `review${reviewIndex}`
                toast.loading("Concluindo revisão...", { id: "conclude-review" });
                await changeReviewStatus(item.id, reviewKey, true);
                toast.success("Revisão concluída!", { id: "conclude-review" });
            } catch {
                toast.error("Erro ao concluir revisão.", { id: "conclude-review" });
            }
        });
    };

    return (
        <div className="w-full block">
            <DialogDemo
                variant="label"
                title={item.title}
                description="Informações sobre o tópico da revisão"
                disableBtns={true}
                contentBtn={
                    <div className="hoverComponents flex items-center justify-between w-full gap-3 border border-base-content/10 bg-base-200/30 p-2 rounded-md hover:bg-base-200/60 transition-all">
                        <div className="flex-1 min-w-0 text-sm flex items-center gap-2.5">
                            <span
                                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: item.subject.color }}
                                aria-hidden="true"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate text-start font-medium text-base-content">
                                    {item.title}
                                </span>
                                <span className="truncate text-start text-xs text-base-content/60 mt-0.5 opacity-50">
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
                                    className="shrink-0 ml-2"
                                    onClick={handleConclude}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    {isPending ? "Salvando..." : "Feito"}
                                </Button>
                            </>
                        )}
                    </div>
                }
            >
                <TopicInfoGroup
                    subject={item.subject.title}
                    color={item.subject.color}
                    topic={item}
                    hasAttachments={hasAttachments}
                />
            </DialogDemo>
        </div>
    );
}

export function ReviewSection({ title, icon, reviewIndex, topics }: ReviewSectionProps) {
    const hasTopics = topics && topics.length > 0;

    return (
        <div className="p-4 mx-2 border border-base-content/10 rounded-lg overflow-hidden shadow-sm bg-card">
            <div className="flex gap-2 items-center mb-3 font-semibold text-base-content">
                {icon}
                <h2 className="text-lg">{title}</h2>
                <span className="text-xs bg-base-200 text-base-content/80 px-2.5 py-0.5 rounded-full ml-auto font-medium">
                    {topics?.length || 0}
                </span>
            </div>

            {!hasTopics ? (
                <p className="text-xs text-base-content/50 italic py-3 text-center">
                    Nenhuma revisão para este período.
                </p>
            ) : (
                <div className="flex flex-col gap-3 w-full">
                    {topics.map((item, index) => {
                        return (
                            <ReviewItem
                                key={item.id || index}
                                item={item}
                                reviewIndex={reviewIndex}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    );
}

export function ReviewSectionSkeleton() {
    const sections = [
        { title: "24 horas", reviewIndex: 1, icon: <Clock size={20} /> },
        { title: "7 dias", reviewIndex: 2, icon: <Clock size={20} /> },
        { title: "30 dias", reviewIndex: 3, icon: <Clock size={20} /> },
        { title: "Concluído", icon: <CheckCircle2 size={20} className="text-green-500" /> },
    ];

    return (
        <>
            <p className="p-2 py-4 pb-1 font-medium text-sm text-muted-foreground ">
                Visualize suas revisões. Elas são espaçadas entre 24 horas, 7 dias e 30 dias.
            </p>
            {sections.map((sec, index) => (
                <div className="p-4 mx-2 border border-base-content/10 rounded-lg overflow-hidden shadow-sm bg-card" key={index}>
                    <div className="flex gap-2 items-center mb-3 font-semibold text-base-content">
                        {sec.icon}
                        <h2 className="text-lg">{sec.title}</h2>
                        <span className="text-xs bg-base-200 text-base-content/80 px-2.5 py-0.5 rounded-full ml-auto font-medium">
                            <Spinner />
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex gap-2 p-3 items-center border border-base-content/5 rounded-md"
                            >
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <div className="flex flex-col gap-1 w-full">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </>

    );
}

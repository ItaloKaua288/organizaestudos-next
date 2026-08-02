"use client";

import { changeReviewStatus } from "@/actions/review.actions";
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Topic } from "@/types/topic";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import toast from "react-hot-toast";

interface ReviewSectionProps {
    title: string;
    icon: React.ReactNode;
    reviewIndex: string | number;
    topics: Topic[];
}

interface ReviewItemProps {
    item: Topic;
    reviewIndex: string | number;
}

function ReviewItem({ item, reviewIndex }: ReviewItemProps) {
    const [isPending, startTransition] = useTransition();
    const hasAttachments = Boolean(item.attachments && item.attachments.length > 0);


    const brString = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const now = new Date(brString);

    let reviewDate;

    if (reviewIndex === 1)
        reviewDate = new Date(item.reviews.first.date)
    else if (reviewIndex === 2)
        reviewDate = new Date(item.reviews.second.date)
    else
        reviewDate = new Date(item.reviews.third.date)

    reviewDate.setHours(0, 0, 0, 0)

    const diffMs = reviewDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const handleConclude = (e: React.MouseEvent) => {
        e.stopPropagation();

        startTransition(async () => {
            await changeReviewStatus(item.id, `review${reviewIndex}`, true);
            toast.success("Revisão concluída!")
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
                        {diffHours <= 24 ? (
                            diffHours > 1 ? (
                                <div className="text-xs">Em {diffHours} horas</div>
                            ) : (
                                <Badge variant={"outline"}>Hoje</Badge>
                            )
                        ) : (
                            <div className="text-xs">Em {diffDays} dias e {diffHours - (diffDays * 24)} horas</div>
                        )}
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
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDemo } from "@/components/dialog-button";
import { Topic } from "@/types/topic";
import { TopicInfoGroup } from "@/components/topic-info-group";

interface ReviewSectionProps {
    title: string;
    icon: React.ReactNode;
    topics: Topic[];
}

export function ReviewSection({ title, icon, topics }: ReviewSectionProps) {
    return (
        <div className="p-4 mx-2 border border-base-content/10 rounded-lg overflow-hidden bg-base-100 shadow-sm bg-card">
            <div className="flex gap-2 items-center mb-3 font-semibold text-base-content">
                {icon}
                <h2 className="text-lg">{title}</h2>
                <span className="text-xs bg-base-200 text-base-content/80 px-2.5 py-0.5 rounded-full ml-auto font-medium">
                    {topics?.length || 0}
                </span>
            </div>

            {!topics || topics.length === 0 ? (
                <p className="text-xs text-base-content/50 italic py-3 text-center">
                    Nenhuma revisão para este período.
                </p>
            ) : (
                <div className="flex flex-col gap-3 w-full">
                    {topics.map((item, index) => {
                        const hasAttachments = item.attachments && item.attachments.length > 0;

                        return (
                            <div key={index} className="w-full block">

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

                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="shrink-0 ml-2"
                                                onClick={(e) => { e.stopPropagation(); }}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                Feito
                                            </Button>
                                        </div>
                                    }
                                >
                                    <TopicInfoGroup subject={item.subject.title} color={item.subject.color} topic={item} hasAttachments={hasAttachments} />
                                </DialogDemo>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
import { changeReviewStatus } from "@/actions/review.actions";
import { Topic } from "@/types/topic";
import { FileText, RotateCcw } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Label } from "./ui/label";

type TopicInfoDialogProps = {
    subject: string;
    topic: Topic;
    color: string;
    hasAttachments: boolean | undefined;
}

export const formatUtcDateToLocalDisplay = (utcDateString: string | Date | undefined): string => {
    if (!utcDateString) return '';
    const dateObj = new Date(utcDateString);
    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();

    const localDate = new Date(year, month, day);
    return localDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isDateOverdue = (dateString: string | Date | undefined): boolean => {
    if (!dateString) return false;

    const reviewDateUTC = new Date(dateString);
    if (isNaN(reviewDateUTC.getTime())) return false;

    const reviewDate = new Date(
        reviewDateUTC.getUTCFullYear(),
        reviewDateUTC.getUTCMonth(),
        reviewDateUTC.getUTCDate()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today.getTime() >= reviewDate.getTime();
};

const isToday = (date: Date | string): boolean => {
    if (!date) return false;
    const targetUTC = new Date(date);
    if (isNaN(targetUTC.getTime())) return false;

    const target = new Date(
        targetUTC.getUTCFullYear(),
        targetUTC.getUTCMonth(),
        targetUTC.getUTCDate()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today.getTime() === target.getTime();
};

export function TopicInfoGroup({ subject, topic, color, hasAttachments }: TopicInfoDialogProps) {
    const handleUndoConclude = async (e: React.MouseEvent, topicId: string, reviewIndex: string | number) => {
        e.stopPropagation();

        await changeReviewStatus(topicId, `review${reviewIndex}`, false);
    };

    return (
        <FieldGroup>
            <Field className="flex flex-row gap-2 items-center">
                <Label htmlFor="description-1">
                    Matéria:
                    <div className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full shrink-0 inline-block align-middle" style={{ backgroundColor: color }} aria-hidden="true"></span>
                        <span className="font-semibold truncate">{subject}</span>
                    </div>
                </Label>
            </Field>
            <Field>
                <Label>
                    Status:
                    <Badge className="" {...(topic.status === "CONCLUIDO" ? { variant: "default" } : { variant: "secondary" })}>{topic.status}</Badge>
                </Label>
            </Field>
            <Field>
                <Label>Cronograma de Revisões:</Label>
                {topic.status === "CONCLUIDO" ? (
                    <div className="grid grid-cols-2 border rounded-lg p-2 gap-1 text-xs sm:text-sm dark:bg-neutral-800/50">
                        <span className="flex items-center">1° Revisão (24h): </span>
                        <div className="flex gap-1 justify-end items-center">
                            {topic.reviews.first.concluded ? <Badge variant={"secondary"} className="">Concluído</Badge> : isToday(topic.reviews.first.date) ? <Badge variant={"secondary"} className="">Hoje</Badge> : ""}
                            <span className={`${topic.reviews.first.concluded ? "text-green-500 line-through" : isToday(topic.reviews.first.date) ? "text-primary" : isDateOverdue(topic.reviews.first.date) ? "text-destructive" : ""} text-right font-mono flex gap-1 `}>{formatUtcDateToLocalDisplay(topic.reviews.first.date)} </span>
                            {topic.reviews.first.concluded ? <Button onClick={(e) => handleUndoConclude(e, topic.id, 1)} variant={"secondary"}><RotateCcw size={15} /></Button> : <span className="opacity-40 w-9.5 h-9 flex items-center justify-center"><RotateCcw size={16} /></span>}
                        </div>
                        <span className="flex items-center">2° Revisão (7 dias): </span>
                        <div className="flex gap-1 justify-end items-center">
                            {topic.reviews.second.concluded ? <Badge variant={"secondary"} className="">Concluído</Badge> : isToday(topic.reviews.second.date) ? <Badge variant={"secondary"} className="">Hoje</Badge> : ""}
                            <span className={`${topic.reviews.second.concluded ? "text-green-500 line-through" : isToday(topic.reviews.second.date) ? "text-primary" : isDateOverdue(topic.reviews.second.date) ? "text-destructive" : ""} text-right font-mono flex gap-1 `}>{formatUtcDateToLocalDisplay(topic.reviews.second.date)}</span>
                            {topic.reviews.second.concluded ? <Button onClick={(e) => handleUndoConclude(e, topic.id, 2)} variant={"secondary"}><RotateCcw size={15} /></Button> : <span className="opacity-40 w-9.5 h-9 flex items-center justify-center"><RotateCcw size={16} /></span>}
                        </div>
                        <span className="flex items-center">3° Revisão (30 dias): </span>
                        <div className="flex gap-1 justify-end items-center">
                            {topic.reviews.third.concluded ? <Badge variant={"secondary"} className="">Concluído</Badge> : isToday(topic.reviews.third.date) ? <Badge variant={"secondary"} className="">Hoje</Badge> : ""}
                            <span className={`${topic.reviews.third.concluded ? "text-green-500 line-through" : isToday(topic.reviews.third.date) ? "text-primary" : isDateOverdue(topic.reviews.third.date) ? "text-destructive" : ""} text-right font-mono flex gap-1 `}>{formatUtcDateToLocalDisplay(topic.reviews.third.date)}</span>
                            {topic.reviews.third.concluded ? <Button onClick={(e) => handleUndoConclude(e, topic.id, 3)} variant={"secondary"}><RotateCcw size={15} /></Button> : <span className="opacity-40 w-9.5 h-9 flex items-center justify-center"><RotateCcw size={16} /></span>}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-base-content/50 italic mt-1">Conclua o assunto para ver o cronograma de revisões.</p>
                )}
            </Field>
            <Field>
                <Label>Anexos ({topic.attachments?.length || 0}):</Label>
                {hasAttachments ? (
                    <div className="flex flex-col gap-2 max-h-50 overflow-auto transition-colors">
                        {topic.attachments?.map((attachment) => (
                            <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm border p-1 hover:bg-secondary truncate w-full rounded-sm"
                            >
                                <FileText size={15} className="inline-block mr-1" />
                                {attachment.name}
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-base-content/50 italic mt-1">Nenhum PDF anexado.</p>
                )}
            </Field>
        </FieldGroup>
    )
}
"use client";

import { changeReviewStatus } from "@/actions/review.actions";
import { deleteAttachAction } from "@/actions/topics.actions";
import { isDateOverdue, isToday } from "@/lib/date";
import { openTopicAttachmentAction } from "@/actions/topics.actions";
import { Topic } from "@/types/topic";
import { FileText, RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
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

export function TopicInfoGroup({ subject, topic, color, hasAttachments }: TopicInfoDialogProps) {
    const [isLoading, setIsLoading] = useState<number | null>(null);

    const handleUndoConclude = async (e: React.MouseEvent, topicId: string, reviewIndex: string | number) => {
        e.stopPropagation();
        setIsLoading(reviewIndex as number);
        toast.loading("Desfazendo revisão...", { id: "undo-review" });
        await changeReviewStatus(topicId, `review${reviewIndex}`, false);
        toast.success("Revisão desfeita!", { id: "undo-review" })
        setIsLoading(null);
    };

    const handleTopicAttachmentOpen = async (attachmentPublicId: string) => {
        try {
            toast.loading("Abrindo anexo...", { id: "open-attachment" })
            const formData = new FormData();
            formData.append("topicId", topic.id)
            formData.append("public_id", attachmentPublicId)
            const blob = (await openTopicAttachmentAction(formData)).blob

            if (blob) {
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 10000);
                toast.success("Anexo aberto", { id: "open-attachment" });
            } else {
                toast.error("Falha ao abrir o anexo", { id: "open-attachment" });
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao abrir o anexo!", { id: "open-attachment" })
        }
    }

    const handleTopicAttachmentDelete = async (public_id: string) => {
        try {
            const formData = new FormData();
            formData.append("topicId", topic.id);
            formData.append("public_id", public_id)
            formData.append("subject_id", topic.subject.id)
            toast.loading("deletando...", { id: "delete-attachment" })
            await deleteAttachAction(formData)
            toast.success("Anexo deletado!", { id: "delete-attachment" })
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar o anexo!", { id: "delete-attachment" })
        }
    }

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
                            {topic.reviews.first.concluded ? <Badge variant={"secondary"} className="text-[10px]">Concluído</Badge> : isToday(topic.reviews.first.date) ? <Badge variant={"secondary"} className="text-[10px]">Hoje</Badge> : ""}
                            <span className={`${topic.reviews.first.concluded ? "text-green-500 line-through" : isToday(topic.reviews.first.date) ? "text-primary" : isDateOverdue(topic.reviews.first.date) ? "text-destructive" : ""} text-right font-mono flex gap-1 `}>{formatUtcDateToLocalDisplay(topic.reviews.first.date)} </span>
                            {topic.reviews.first.concluded ? <Button disabled={!!isLoading} onClick={(e) => handleUndoConclude(e, topic.id, 1)} variant={"secondary"}><RotateCw className={`${isLoading === 1 ? "animate-spin animation-duration-[400ms]" : ""}`} size={15} /></Button> : <span className="opacity-40 w-9.5 h-9 flex items-center justify-center"><RotateCw size={16} /></span>}
                        </div>
                        <span className="flex items-center">2° Revisão (7 dias): </span>
                        <div className="flex gap-1 justify-end items-center">
                            {topic.reviews.second.concluded ? <Badge variant={"secondary"} className="text-[10px]">Concluído</Badge> : isToday(topic.reviews.second.date) ? <Badge variant={"secondary"} className="text-[10px]">Hoje</Badge> : ""}
                            <span className={`${topic.reviews.second.concluded ? "text-green-500 line-through" : isToday(topic.reviews.second.date) ? "text-primary" : isDateOverdue(topic.reviews.second.date) ? "text-destructive" : ""} text-right font-mono flex gap-1 `}>{formatUtcDateToLocalDisplay(topic.reviews.second.date)}</span>
                            {topic.reviews.second.concluded ? <Button disabled={!!isLoading} onClick={(e) => handleUndoConclude(e, topic.id, 2)} variant={"secondary"}><RotateCw className={`${isLoading === 2 ? "animate-spin animation-duration-[400ms]" : ""}`} size={15} /></Button> : <span className="opacity-40 w-9.5 h-9 flex items-center justify-center"><RotateCw size={16} /></span>}
                        </div>
                        <span className="flex items-center">3° Revisão (30 dias): </span>
                        <div className="flex gap-1 justify-end items-center">
                            {topic.reviews.third.concluded ? <Badge variant={"secondary"} className="text-[10px]">Concluído</Badge> : isToday(topic.reviews.third.date) ? <Badge variant={"secondary"} className="text-[10px]">Hoje</Badge> : ""}
                            <span className={`${topic.reviews.third.concluded ? "text-green-500 line-through" : isToday(topic.reviews.third.date) ? "text-primary" : isDateOverdue(topic.reviews.third.date) ? "text-destructive" : ""} text-right font-mono flex gap-1 `}>{formatUtcDateToLocalDisplay(topic.reviews.third.date)}</span>
                            {topic.reviews.third.concluded ? <Button disabled={!!isLoading} onClick={(e) => handleUndoConclude(e, topic.id, 3)} variant={"secondary"}><RotateCw className={`${isLoading === 3 ? "animate-spin animation-duration-[400ms]" : ""}`} size={15} /></Button> : <span className="opacity-40 w-9.5 h-9 flex items-center justify-center"><RotateCw size={16} /></span>}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-base-content/50 italic mt-1">Conclua o assunto para ver o cronograma de revisões.</p>
                )}
            </Field>
            <Field>
                <Label>Anexos:<Badge variant={"outline"}>{topic.attachments?.length || 0}</Badge></Label>
                {hasAttachments ? (
                    <div className="flex flex-col gap-1 px-2 py-1">
                        {topic.attachments!.map((attachment, index) => (
                            <div key={attachment.id || index} className="flex gap-1 items-center w-full">
                                <span
                                    onClick={() => handleTopicAttachmentOpen(attachment.public_id!)}
                                    className="flex items-center w-full rounded-sm border p-1 text-sm truncate hover:bg-secondary transition-colors cursor-pointer"
                                >
                                    <FileText size={15} className="mr-2 shrink-0" color={topic.subject.color} />
                                    <span className="flex-1 truncate">{attachment.name}</span>
                                </span>
                                <Button
                                    variant={"outline"}
                                    className={"hover:text-destructive"}
                                    onClick={() => handleTopicAttachmentDelete(attachment.public_id!)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-base-content/50 italic mt-1">Nenhum PDF anexado.</p>
                )}
            </Field>
        </FieldGroup>
    )
}
"use client"

import { createTimelineAction, deleteTimelineAction, updateTimelineAction } from "@/actions/timeline.actions";
import { openTopicAttachmentAction } from "@/actions/topics.actions";
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subject } from "@/types/subject";
import { Timeline } from "@/types/timeline";
import { Topic } from "@/types/topic";
import { BookOpen, ExternalLink, Eye, FileText, Paperclip, PencilIcon, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

const ICON_BTN = "size-7 rounded-lg border-transparent bg-transparent p-0 text-muted-foreground shadow-none hover:bg-foreground/8 hover:text-foreground";

const WEEK_DAYS = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
]

type DayCardProps = {
    dayLabel: string;
    date: string;
    isToday: boolean;
    dayEvents: Timeline[];
    pendingTopicsBySubject: Record<string, Topic>;
    subjects: Subject[];
    reviews?: Topic[];
}

export function DayCard({ dayLabel, date, isToday, dayEvents, pendingTopicsBySubject, subjects, reviews }: DayCardProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.target as HTMLFormElement);
        formData.append("day", dayLabel);

        try {
            toast.loading("Adicionando evento...", { id: "add-timeline" });
            const result = await createTimelineAction(formData);
            if (result.success) {
                toast.success(result.message, { id: "add-timeline" });
                setIsAddOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Erro ao adicionar evento.", { id: "add-timeline" });
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className={cn("glass flex h-full max-h-150 flex-col rounded-2xl", isToday && "border border-primary ring-2 ring-primary/50")}>
            <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
                <div className="min-w-0">
                    <h3 className="flex items-center gap-2 truncate text-base font-semibold">
                        <span className="truncate">{dayLabel}</span>
                        {/* {isToday && <Badge className="shrink-0">Hoje</Badge>} */}
                    </h3>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>
                <div className="shrink-0">
                    <DialogDemo
                        open={isAddOpen}
                        onOpenChange={setIsAddOpen}
                        title={`Adicionar matéria na ${dayLabel}`}
                        description="Preencha os horários."
                        nameConfirmBtn={isPending ? "Adicionando..." : "Adicionar"}
                        onSubmit={handleAddSubmit}
                        contentBtn={
                            <div className="flex items-center gap-1">
                                <Plus className="h-4 w-4" />
                                <span>Adicionar</span>
                            </div>
                        }
                    >
                        <FieldGroup>
                            <Field>
                                <Label>Matéria:</Label>
                                <Select name="subject_id" required >
                                    <SelectTrigger>
                                        <SelectValue render={(value) => {
                                            const subject = subjects.find((s) => s.id === value.children);
                                            return <span>{subject?.title ?? "Selecione uma matéria"}</span>;
                                        }} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Matérias</SelectLabel>
                                            {subjects.map((subject) => (
                                                <SelectItem key={subject.id} value={subject.id}>
                                                    {subject.title}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Início:</Label>
                                    <Input name="startTime" type="time" required disabled={isPending} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Fim:</Label>
                                    <Input name="endTime" type="time" required disabled={isPending} />
                                </div>
                            </Field>
                        </FieldGroup>
                    </DialogDemo>
                </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto px-2 pb-3">
                {reviews && reviews.length > 0 && (
                    <div className="flex max-h-40 w-full flex-col gap-1 border-b border-border px-2 pb-3">
                        <h4 className="truncate text-sm font-medium text-muted-foreground">Revisões</h4>
                        <div className="flex flex-col gap-0.5 overflow-y-auto">

                            {reviews.map((review) => (
                                <DialogDemo
                                    title={review.title}
                                    description="Detalhes do assunto atual"
                                    contentBtn={<span className="flex items-center gap-2 truncate text-xs">
                                        <BookOpen className="h-3.5 w-3.5 shrink-0" color={review.subject.color} />
                                        <span className="truncate ">{review.title}</span>
                                    </span>}
                                    classNameBtn="flex h-auto w-full justify-start truncate rounded-lg border-transparent bg-transparent px-2 py-1.5 shadow-none hover:bg-foreground/6"
                                    disableBtns={true}
                                    key={review.id}
                                >
                                    <TopicInfoGroup subject={review.subject.title} topic={review} color={review.subject.color} hasAttachments={review.attachments && review.attachments.length > 0}></TopicInfoGroup>
                                </DialogDemo>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col ">
                {dayEvents.map((item) => (
                    <EventItem
                        key={item.id}
                        item={item}
                        nextTopic={item.subject?.id ? pendingTopicsBySubject[item.subject.id] : undefined}
                    />
                ))}
                </div>

                {dayEvents.length === 0 && !(reviews && reviews.length > 0) && (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                        Nenhuma matéria neste dia. Use o botão Adicionar.
                    </p>
                )}
            </div>
        </div>
    )
}

function EventItem({ item, nextTopic }: { item: Timeline, nextTopic?: Topic }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasAttachments = nextTopic?.attachments && nextTopic.attachments.length > 0;

    const handleTopicAttachmentOpen = async (attachmentPublicId: string) => {
        if (!nextTopic) return;
        const newTab = window.open("about:blank", "_blank");

        try {
            toast.loading("Abrindo anexo...", { id: "open-attachment" });
            const formData = new FormData();
            formData.append("topicId", nextTopic.id);
            formData.append("public_id", attachmentPublicId);

            const blob = (await openTopicAttachmentAction(formData)).blob;

            if (blob && newTab) {
                const url = URL.createObjectURL(blob);

                newTab.location.href = url;
                toast.success("Anexo aberto", { id: "open-attachment" });

                setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
                if (newTab) newTab.close();
                toast.error("Falha ao abrir o anexo", { id: "open-attachment" });
            }
        } catch {
            if (newTab) newTab.close();
            toast.error("Falha ao abrir o anexo", { id: "open-attachment" });
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target as HTMLFormElement);

        try {
            const result = await updateTimelineAction(formData);
            if (result.success) {
                toast.success(result.message);
                setIsEditOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Erro ao atualizar evento.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async () => {
        try {
            const formData = new FormData();
            formData.append("timeline_id", item.id)
            const result = await deleteTimelineAction(formData);
            if (result.success) toast.success(result.message);
            else toast.error(result.message);
        } catch {
            toast.error("Erro ao deletar evento.");
        }
    }

    return (
        <div className="flex flex-col gap-1 rounded-lg px-2 py-2.5 transition-colors hover:bg-foreground/6 border-b">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.subject?.color || "#ccc" }}
                            aria-hidden="true"
                        />
                        <span className="truncate text-sm font-medium">
                            {item.subject?.title || "Sem matéria"}
                        </span>
                    </div>
                    <span className="pl-[18px] text-xs tabular-nums text-muted-foreground">
                        {item.start_time} - {item.end_time}
                    </span>
                </div>

                <div className="flex shrink-0 items-center">
                    <Link
                        href={`/materias/${item.subject?.id}`}
                        aria-label="Abrir matéria"
                        title="Abrir matéria"
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                    {nextTopic && (
                        <DialogDemo
                            variant="button"
                            title={nextTopic.title}
                            description="Detalhes do tópico atual"
                            contentBtn={<Eye className="h-4 w-4" />}
                            classNameBtn={ICON_BTN}
                            disableBtns={true}
                            variantDialogBtn={"ghost"}
                        >
                            <div className="space-y-4 min-w-0">
                                <div>
                                    <span className="text-sm font-semibold">Matéria: </span>
                                    <span className="text-sm">{nextTopic.subject.title}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold flex items-center gap-1 mb-2">
                                        <Paperclip className="h-4 w-4" /> Anexos: <Badge variant={"secondary"}>{nextTopic.attachments.length}</Badge>
                                    </span>
                                    {!hasAttachments ? (
                                        <p className="text-sm text-muted-foreground">Sem anexos.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2 min-w-0">
                                            {nextTopic.attachments!.map((attachment) => (
                                                <div key={attachment.id} className="w-full min-w-0 text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTopicAttachmentOpen(attachment.public_id!)}
                                                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                                    >
                                                        <FileText className="h-4 w-4 shrink-0" style={{ color: nextTopic.subject.color }} />
                                                        <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogDemo>
                    )}

                    <DialogDemo
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        title={`Editar: ${item.subject?.title}`}
                        description="Modifique os horários deste evento."
                        nameConfirmBtn={isSubmitting ? "Salvando..." : "Salvar"}
                        onSubmit={handleEditSubmit}
                        classNameBtn={ICON_BTN}
                        variantDialogBtn={"ghost"}
                        contentBtn={<PencilIcon className="h-4 w-4" />}
                    >
                        <input type="hidden" name="subject_id" value={item.subject?.id || ""} />
                        <input type="hidden" name="timeline_id" value={item.id} />

                        <FieldGroup>
                            <Field>
                                <Label>Dia da semana:</Label>
                                <Select defaultValue={item.day} name="day">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um dia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Dias da semana</SelectLabel>
                                            {WEEK_DAYS.map((day) => (
                                                <SelectItem key={day} value={day}>{day}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Início:</Label>
                                    <Input name="startTime" type="time" defaultValue={item.start_time} required disabled={isSubmitting} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Fim:</Label>
                                    <Input name="endTime" type="time" defaultValue={item.end_time} required disabled={isSubmitting} />
                                </div>
                            </Field>
                        </FieldGroup>
                    </DialogDemo>

                    <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} title="Deletar" aria-label="Deletar evento">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {nextTopic && (
                <div className="flex items-center gap-2 pl-[18px] text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{nextTopic.title}</span>
                </div>
            )}
        </div>
    )
}
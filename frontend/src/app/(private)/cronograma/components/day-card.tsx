"use client"

import { addTimelineAction, deleteTimelineAction } from "@/actions/timeline.actions";
import { DialogDemo } from "@/components/dialog-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Attachment } from "@/types/apiResponse";
import { Subject } from "@/types/subject";
import { Timeline } from "@/types/timeline";
import { Topic } from "@/types/topic";
import { BookOpen, FileText, Paperclip, PencilIcon, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type DayCardProps = {
    dayLabel: string;
    date: Date;
    isToday: boolean;
    dayEvents: Timeline[];
    pendingTopicsBySubject: Record<string, Topic>;
    subjects: Subject[];
    reviews?: Topic[];
}

export function DayCard({ dayLabel, date, isToday, dayEvents, pendingTopicsBySubject, subjects, reviews }: DayCardProps) {
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        formData.append("day", dayLabel);

        const result = await addTimelineAction(formData);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }

    const handleDeleteEvent = async (e: React.MouseEvent<HTMLButtonElement>, timeLineId: string) => {
        e.stopPropagation();
        const result = await deleteTimelineAction(timeLineId);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Card className={`border max-h-150 overflow-y-auto transition-all ${isToday ? "border border-primary/50 shadow-sm shadow-primary/50" : ""}`}>
            <CardHeader>
                <CardTitle className="truncate">{dayLabel}</CardTitle>
                <CardDescription>
                    {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </CardDescription>

                <CardAction>
                    <DialogDemo
                        title={`Adicionar matéria na ${dayLabel}`}
                        description="Preencha os horários."
                        nameConfirmBtn="Adicionar"
                        onSubmit={(e) => handleFormSubmit(e)}
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
                                <Select name="subject" required>
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
                                    <Input name="startTime" type="time" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Fim:</Label>
                                    <Input name="endTime" type="time" required />
                                </div>
                            </Field>
                        </FieldGroup>
                    </DialogDemo>
                </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col space-y-3 pb-4">
                {reviews?.length ? (
                    <div className="border p-3 rounded-md flex flex-col gap-1 w-full max-h-30">
                        <h3 className="truncate w-full border-b pb-1">Revisões</h3>
                        <div className="overflow-y-auto">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex gap-1 text-xs items-center w-full border-b py-1">
                                    <BookOpen className="h-3.5 w-3.5 shrink-0" color={review.subject.color} />
                                    <span className="truncate">{review.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
                {dayEvents.map((item) => {
                    const nextTopic = item.subject?.id ? pendingTopicsBySubject[item.subject.id] : undefined
                    const hasAttachments = nextTopic?.attachments && nextTopic.attachments.length > 0

                    const scheduleCard = (
                        <Card className="hover:border-primary/40 transition-colors hover:cursor-pointer hoverComponents">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex flex-col gap-1 truncate">
                                    <div className="flex gap-2 items-center">
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: item.subject?.color || "#ccc" }}
                                            aria-hidden="true"
                                        />
                                        <span className="font-medium truncate text-sm">
                                            {item.subject?.title || "Sem matéria"}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.start_time} - {item.end_time}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation() }}>
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => handleDeleteEvent(e, item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            {nextTopic && (
                                <CardFooter className="py-2 bg-muted/40 mt-2">
                                    <div className="flex w-full gap-1.5 items-center text-xs text-muted-foreground truncate">
                                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{nextTopic.title}</span>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    )

                    if (!nextTopic) {
                        return <div key={item.id}>{scheduleCard}</div>
                    }

                    return (
                        <DialogDemo
                            key={item.id}
                            variant="label"
                            title={nextTopic.title}
                            description="Detalhes do tópico atual"
                            contentBtn={scheduleCard}
                        >
                            <div className="space-y-4 min-w-0">
                                <div>
                                    <span className="text-sm font-semibold">Matéria: </span>
                                    <span className="text-sm">{nextTopic.subject.title}</span>
                                </div>

                                <div>
                                    <span className="text-sm font-semibold flex items-center gap-1 mb-2">
                                        <Paperclip className="h-4 w-4" /> Anexos:
                                    </span>

                                    {!hasAttachments ? (
                                        <p className="text-sm text-muted-foreground">Sem anexos para este tópico.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2 min-w-0">
                                            {nextTopic.attachments!.map((attachment: Attachment) => (
                                                <div key={attachment.id} className="flex w-full min-w-0 gap-2 items-center text-sm">
                                                    <FileText
                                                        className="h-4 w-4 shrink-0"
                                                        style={{ color: nextTopic.subject.color }}
                                                    />
                                                    <span className="min-w-0 flex-1 truncate">
                                                        {attachment.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogDemo>
                    )
                })}
            </CardContent>
        </Card >
    )
}
"use client"

import { addTimelineAction, deleteTimelineAction, updateTimelineAction } from "@/actions/timeline.actions";
import { DialogDemo } from "@/components/dialog-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Subject } from "@/types/subject";
import { Timeline } from "@/types/timeline";
import { Topic } from "@/types/topic";
import { BookOpen, Eye, FileText, Info, Paperclip, PencilIcon, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

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
    const [subjectValue, setSubjectValue] = useState("")

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.target as HTMLFormElement);
        formData.append("day", dayLabel);

        try {
            const result = await addTimelineAction(formData);
            if (result.success) {
                toast.success(result.message);
                setIsAddOpen(false); // Fecha o modal no sucesso
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Erro ao adicionar evento.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Card className={`border max-h-150 flex flex-col transition-all ${isToday ? "border-primary/50 shadow-sm shadow-primary/50" : ""}`}>
            <CardHeader>
                <CardTitle className="truncate">{dayLabel}</CardTitle>
                <CardDescription>{date}</CardDescription>
                <CardAction>
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
                                <Select name="subject" required >
                                    <SelectTrigger>
                                        <SelectValue render={(value) => {
                                            const subject = subjects.find((s) => s.id === value.children);
                                            return <span>{subject?.title ?? "Selecione uma matéria"}</span>;
                                        }}/>
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
                </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col space-y-3 pt-1 pb-4 overflow-y-auto">
                {reviews && reviews.length > 0 && (
                    <div className="border p-3 rounded-md flex flex-col gap-1 w-full max-h-40">
                        <h3 className="truncate w-full border-b pb-1 font-semibold text-sm">Revisões</h3>
                        <div className="overflow-y-auto flex flex-col gap-1 pt-1">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex gap-2 text-xs items-center w-full py-1">
                                    <BookOpen className="h-3.5 w-3.5 shrink-0" color={review.subject.color} />
                                    <span className="truncate">{review.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {dayEvents.map((item) => (
                    <EventItem
                        key={item.id}
                        item={item}
                        nextTopic={item.subject?.id ? pendingTopicsBySubject[item.subject.id] : undefined}
                    />
                ))}
            </CardContent>
        </Card>
    )
}

function EventItem({ item, nextTopic }: { item: Timeline, nextTopic?: Topic }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasAttachments = nextTopic?.attachments && nextTopic.attachments.length > 0;

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
            const result = await deleteTimelineAction(item.id);
            if (result.success) toast.success(result.message);
            else toast.error(result.message);
        } catch {
            toast.error("Erro ao deletar evento.");
        }
    }

    return (
        <Card className="transition-colors hover:border-primary/40 relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col gap-1 min-w-0 pr-2">
                    <div className="flex gap-2 items-center truncate">
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

                <div className="flex items-center gap-2 shrink-0">
                    {nextTopic && (
                        <DialogDemo
                            variant="button"
                            title={nextTopic.title}
                            description="Detalhes do tópico atual"
                            contentBtn={<Eye className="h-4 w-4" />}
                            disableBtns={true}
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
                                                    <Link href={attachment.url || "#"} target="_blank" className="flex gap-2 items-center w-full border hoverComponentsStatic p-0.5 rounded-sm" >
                                                        <FileText className="h-4 w-4 shrink-0" style={{ color: nextTopic.subject.color }} />
                                                        <span className="min-w-0 flex-1 truncate">{attachment.name} afsf asfas fasfasfasfasfas fas fas fasf as</span>
                                                    </Link>
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
                        classNameBtn="border-none dark:bg-transparent bg-transparent dark:hover:bg-transparent hover:bg-transparent hover:text-primary"
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

                    <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-transparent dark:hover:bg-transparent" onClick={handleDelete} title="Deletar">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            {nextTopic && (
                <CardFooter className="py-2 bg-muted/40 mt-1">
                    <div className="flex w-full gap-2 items-center text-xs text-muted-foreground truncate">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{nextTopic.title}</span>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}

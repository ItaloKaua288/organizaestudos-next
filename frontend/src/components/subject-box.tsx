"use client";

import { ArrowUp, ArrowDown, CheckCircle2, Paperclip, PencilLine, Trash2, Eye, FileText, Clock, Plus } from "lucide-react";
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { FieldGroup, Field } from "./ui/field";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ColorPicker } from "./ui/color-picker";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { deleteSubject, updateSubject } from "@/services/subjects.service";
import { Subject } from "@/types/subject";
import { TopicStatus, Topic } from "@/types/topic";
import { Button } from "./ui/button";
import { createTopic } from "@/services/topics.service";

type SubjectBoxProps = {
    subject: Subject;
    onStatusChange?: (topicId: string, newStatus: TopicStatus) => void;
    onMoveUp?: (index: number) => void;
    onMoveDown?: (index: number) => void;
    onAttachPDF?: (topicId: string, file: File) => void;
    onEditTopic?: (topicId: string) => void;
    onDeleteTopic?: (topicId: string) => void;
    onUpdate?: () => void;
};

export default function SubjectBox({
    subject,
    onStatusChange,
    onMoveUp,
    onMoveDown,
    onAttachPDF,
    onEditTopic,
    onDeleteTopic,
    onUpdate,
}: SubjectBoxProps) {
    const [draftTitle, setDraftTitle] = useState(subject.title);
    const [draftColor, setDraftColor] = useState(subject.color);
    const [topicTitle, setTopicTitle] = useState("")
    const [isPending, setIsPending] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setDraftTitle(subject.title);
            setDraftColor(subject.color);
        }
        fetchData()
    }, [subject.title, subject.color]);

    const handleSubjectFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            await updateSubject(draftTitle, draftColor, subject.id);
            toast.success("Matéria atualizada");
            setIsEditOpen(false)
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Falha ao atualizar a matéria", error);
            toast.error("Falha ao atualizar a matéria");
        } finally {
            setIsPending(false);
        }
    };

    const handleSubjectFormDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            await deleteSubject(subject.id);
            toast.success("Matéria deletada");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Falha ao deletar a matéria", error);
            toast.error("Falha ao deletar a matéria");
        } finally {
            setIsPending(false);
        }
    };

    const handleSubjectCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            await createTopic(topicTitle, subject.id);
            toast.success("Assunto criado");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Falha ao criar o assunto", error);
            toast.error("Falha ao criar o assunto");
        } finally {
            setIsPending(false);
        }
    }

    const topics = subject.topics || [];

    return (
        <div className="rounded-lg border p-4 shadow-sm bg-card">
            <header className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                    />
                    <h2 className="text-md font-bold">{subject.title}</h2>
                </div>

                <div className="flex items-center">
                    <DialogDemo
                        title="Editar a matéria"
                        description="Modifique os detalhes desta matéria."
                        contentBtn={<PencilLine size={15} />}
                        classNameBtn="border-none dark:bg-transparent bg-transparent"
                        onSubmit={handleSubjectFormSubmit}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    >
                        <FieldGroup>
                            <Field>
                                <Label>Nome:</Label>
                                <Input
                                    value={draftTitle}
                                    onChange={(e) => setDraftTitle(e.target.value)}
                                    disabled={isPending}
                                />
                            </Field>
                            <Field>
                                <Label>Escolha uma cor:</Label>
                                <ColorPicker value={draftColor} onChange={setDraftColor} />
                            </Field>
                        </FieldGroup>
                    </DialogDemo>

                    <DialogDemo
                        title="Deletar matéria"
                        description="Tem certeza que deseja deletar a matéria? Esta ação é irreversível."
                        contentBtn={<Trash2 size={15} className="text-destructive" />}
                        classNameBtn="border-none dark:bg-transparent bg-transparent"
                        onSubmit={handleSubjectFormDelete}
                    />
                </div>
            </header>

            <div className="flex flex-col gap-2">
                {topics.map((topic, index) => (
                    <TopicRow
                        key={topic.id}
                        topic={topic}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === topics.length - 1}
                        subject={subject}
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onStatusChange={onStatusChange}
                        onAttachPDF={onAttachPDF}
                        onEditTopic={onEditTopic}
                        onDeleteTopic={onDeleteTopic}
                    />
                ))}
                {topics.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2 text-center">
                        Nenhum assunto cadastrado.
                    </p>
                )}
                <Field className="flex flex-row">
                    <Input className="dark:bg-input/30 bg-input/10 " placeholder="Adicione um assunto" onChange={(e) => (setTopicTitle(e.target.value))} />
                    <Button variant={"outline"} className={"max-w-10 dark:bg-input/30 bg-input/10 "} nativeButton={false} render={<Plus size={15} />} onClick={handleSubjectCreate}></Button>
                </Field>
            </div>
        </div>
    );
}

type TopicRowProps = {
    topic: Topic;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    subject: Subject;
} & Omit<SubjectBoxProps, "subject">;

function TopicRow({
    topic,
    index,
    isFirst,
    isLast,
    subject,
    onMoveUp,
    onMoveDown,
    onStatusChange,
    onAttachPDF,
    onEditTopic,
    onDeleteTopic,
}: TopicRowProps) {
    const hasAttachments = topic.attachments && topic.attachments.length > 0;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onAttachPDF) {
            onAttachPDF(topic.id, file);
        }
        e.target.value = "";
    };

    return (
        <div>
            <div className="hoverComponents flex w-full items-center justify-between gap-2 rounded-lg border border-base-content/10 py-1 px-3 text-sm ">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex flex-col">
                        <button
                            type="button"
                            onClick={() => onMoveUp?.(index)}
                            disabled={isFirst}
                            aria-label="Mover para cima"
                            className="btn btn-ghost btn-xs h-5 w-5 cursor-pointer p-0 hover:text-primary disabled:bg-transparent disabled:text-base-content/20"
                        >
                            <ArrowUp size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onMoveDown?.(index)}
                            disabled={isLast}
                            aria-label="Mover para baixo"
                            className="btn btn-ghost btn-xs h-4 w-4 min-h-0 cursor-pointer p-0 hover:text-primary disabled:bg-transparent disabled:text-base-content/10"
                        >
                            <ArrowDown size={15} />
                        </button>
                    </div>

                    {topic.status === "CONCLUIDO" ? (
                        <CheckCircle2 size={15} className="shrink-0 text-green-500" />
                    ) : (
                        <Clock size={15} className="shrink-0 text-destructive" />
                    )}

                    <span
                        className="block w-full max-w-50 truncate text-left font-medium sm:max-w-xs md:max-w-md lg:max-w-lg"
                        title={topic.title}
                    >
                        {topic.title}
                    </span>

                    <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                        <select
                            value={topic.status}
                            onChange={(e) => onStatusChange?.(topic.id, e.target.value as TopicStatus)}
                            aria-label="Status do tópico"
                            className="select select-bordered select-xs hover:cursor-pointer sm:select-sm"
                        >
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="CONCLUIDO">CONCLUÍDO</option>
                        </select>

                        <DialogDemo
                            contentBtn={<Eye className="h-4 w-4" />}
                            title={topic.title}
                            description="Informações do assunto"
                        >
                            <TopicInfoGroup
                                subject={subject.title}
                                topic={topic}
                                color={subject.color}
                                hasAttachments={hasAttachments}
                            />
                        </DialogDemo>

                        <label
                            className="btn btn-ghost btn-xs cursor-pointer p-1 transition-colors hover:text-primary sm:btn-sm"
                            title="Anexar PDF"
                        >
                            <input
                                accept=".pdf"
                                className="hidden"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <Paperclip size={15} />
                        </label>

                        <DialogDemo
                            title="Editar Assunto"
                            description="Modifique os detalhes deste assunto."
                            contentBtn={<PencilLine className="" size={15} />}
                            classNameBtn="border-0 bg-transparent dark:bg-transparent hover:dark:bg-transparent p-1 m-0 hover:text-primary"
                            nameConfirmBtn="Editar"
                        >
                        </DialogDemo>

                        <DialogDemo
                            title="Excluir Assunto"
                            description="Tem certeza que deseja deletar este assunto? Esta ação é irreversível."
                            contentBtn={<Trash2 className="" size={15} />}
                            classNameBtn="border-0 bg-transparent dark:bg-transparent hover:dark:bg-transparent p-1 m-0 hover:text-destructive"
                            nameConfirmBtn="Excluir"
                        >
                        </DialogDemo>
                        {/* <button
                            type="button"
                            onClick={() => onDeleteTopic?.(topic.id)}
                            className="btn btn-ghost btn-xs p-1 hover:text-destructive sm:btn-sm"
                            title="Deletar Assunto"
                        >
                            <Trash2 size={15} />
                        </button> */}
                    </div>
                </div>
            </div>

            {hasAttachments && (
                <div className="flex flex-col gap-1 px-2 py-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">Anexos:</h3>
                    {topic.attachments!.map((attachment) => (
                        <a
                            key={attachment.id}
                            href={attachment.url}
                            className="flex items-center rounded-sm border p-1 text-sm truncate hover:bg-secondary transition-colors"
                        >
                            <FileText size={15} className="mr-2 shrink-0" />
                            {attachment.name}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
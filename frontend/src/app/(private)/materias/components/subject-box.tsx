"use client";

import { DialogDemo } from "@/components/dialog-button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, PencilLine, Plus, Trash2 } from "lucide-react";

import { useState } from "react";
import toast from "react-hot-toast";

import { deleteSubjectAction, updateSubjectAction } from "@/actions/subjects.actions";
import { createTopicAction } from "@/actions/topics.actions";
import { TopicRow } from "@/components/topic-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Subject } from "@/types/subject";
import Link from "next/link";

type SubjectBoxProps = {
    subject: Subject;
    onUpdate?: () => void;
};

export default function SubjectBox({
    subject,
}: SubjectBoxProps) {
    const [draftColor, setDraftColor] = useState(subject.color);
    const [topicTitle, setTopicTitle] = useState("")
    const [isPending, setIsPending] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false)

    const handleSubjectFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            toast.loading("Atualizando matéria...", { id: "update-subject" });

            const formData = new FormData(e.currentTarget as HTMLFormElement);
            formData.append("color", draftColor)
            formData.append("subject_id", subject.id);

            await updateSubjectAction(formData);
            toast.success("Matéria atualizada", { id: "update-subject" });
            setIsEditOpen(false)
        } catch (error) {
            console.error("Falha ao atualizar a matéria", error);
            toast.error("Falha ao atualizar a matéria", { id: "update-subject" });
        } finally {
            setIsPending(false);
        }
    };

    const handleSubjectFormDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            toast.loading("Deletando matéria...", { id: "delete-subject" });
            const formData = new FormData();
            formData.append("subject_id", subject.id)
            await deleteSubjectAction(formData);
            toast.success("Matéria deletada", { id: "delete-subject" });
        } catch (error) {
            console.error("Falha ao deletar a matéria", error);
            toast.error("Falha ao deletar a matéria", { id: "delete-subject" });
        } finally {
            setIsPending(false);
        }
    };

    const handleSubjectCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsPending(true);
            const formData = new FormData()
            formData.append("subject_id", subject.id)
            formData.append("title", topicTitle)
            await createTopicAction(formData);
            toast.success("Assunto criado");
            setTopicTitle("");
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
                    <Link
                        className="p-2 rounded-lg"
                        href={`/materias/${subject?.id}`}
                        style={{ '--subject-color': subject.color } as React.CSSProperties}
                    >
                        <ExternalLink className="h-4 w-4 hover:text-(--subject-color)" />
                    </Link>

                    <DialogDemo
                        title="Editar a matéria"
                        description="Modifique os detalhes desta matéria."
                        contentBtn={<PencilLine size={15} />}
                        classNameBtn="border-none dark:bg-transparent bg-transparent dark:hover:bg-transparent cursor-pointer"
                        onSubmit={handleSubjectFormSubmit}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    >
                        <FieldGroup>
                            <Field>
                                <Label>Nome:</Label>
                                <Input
                                    name="title"
                                    defaultValue={subject.title}
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
                        classNameBtn="border-none dark:bg-transparent bg-transparent dark:hover:bg-transparent cursor-pointer"
                        nameConfirmBtn="Excluir"
                        variantConfirmBtn={"destructive"}
                        onSubmit={handleSubjectFormDelete}
                    />
                </div>
            </header>

            <div className="flex flex-col gap-2">
                {topics.map((topic, index) => (
                    <TopicRow
                        key={topic.id || `topic-${index}`}
                        topic={topic}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === topics.length - 1}
                        subject={subject}
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



export function SubjectBoxSkeleton() {
    return (
        <div className="rounded-lg border p-4 shadow-sm bg-card">
            <header className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                    <Skeleton className="h-5 w-40" />
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                </div>
            </header>

            <div className="flex flex-col gap-2">
                <TopicRowSkeleton />
                <TopicRowSkeleton />
                <TopicRowSkeleton />

                <div className="flex flex-row gap-2 mt-1">
                    <Input className="dark:bg-input/30 bg-input/10 " placeholder="Adicione um assunto" />
                    <Button variant={"outline"} className={"max-w-10 dark:bg-input/30 bg-input/10"}><Plus size={15} /></Button>
                </div>
            </div>
        </div>
    );
}

function TopicRowSkeleton() {
    return (
        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-base-content/10 py-1 px-3 text-sm h-10.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex flex-col gap-0.5">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                </div>

                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />

                <Skeleton className="h-4 w-3/4 max-w-62.5" />

                <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                    <Skeleton className="h-6 w-24 rounded-md hidden sm:block" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-md" />
                </div>
            </div>
        </div>
    );
}
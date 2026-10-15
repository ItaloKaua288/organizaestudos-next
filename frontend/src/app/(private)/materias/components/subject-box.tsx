"use client";

import { DialogDemo } from "@/components/dialog-button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, ExternalLink, PencilLine, Plus, Trash2 } from "lucide-react";

import { useState } from "react";
import toast from "react-hot-toast";

import { deleteSubjectAction, updateSubjectAction } from "@/actions/subjects.actions";
import { createTopicAction } from "@/actions/topics.actions";
import { SubjectActiveToggle } from "../../../../components/subject-active-toggle";
import { TopicDragGhost, TopicRow } from "@/components/topic-row";
import { useTopicReorder } from "@/hooks/use-topic-reorder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Subject } from "@/types/subject";
import Link from "next/link";

/** Botão de ícone discreto (ghost) para os diálogos da barra de ações. */
const ICON_BTN =
    "size-8 rounded-lg border-transparent bg-transparent p-0 text-muted-foreground shadow-none backdrop-blur-none hover:bg-foreground/8 hover:text-foreground aria-expanded:bg-foreground/8";

type SubjectBoxProps = {
    subject: Subject;
    onUpdate?: () => void;
    /** Controlado pelo pai (botões "Expandir/Reduzir todas"). Padrão: expandida. */
    isExpanded?: boolean;
    onToggleExpanded?: () => void;
};

export default function SubjectBox({
    subject,
    isExpanded = true,
    onToggleExpanded,
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

    const { topics, moveTopic, getTopicMeta, isReordering, draggedId, overId, ghost, ghostRef, getDragProps } = useTopicReorder(subject.id, subject.topics || []);
    const isActive = subject.active !== false;

    if (!isActive) {
        return (
            <div className="glass rounded-2xl p-4 sm:p-5">
                <header className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5 opacity-70">
                        <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: subject.color }}
                            aria-hidden="true"
                        />
                        <h2 className="truncate text-base font-semibold">{subject.title}</h2>
                        <Badge variant="secondary">Desativada</Badge>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                        <SubjectActiveToggle subjectId={subject.id} active={false} />

                        <DialogDemo
                            title="Deletar matéria"
                            description="Tem certeza que deseja deletar a matéria? Esta ação é irreversível."
                            contentBtn={<><Trash2 size={15} /><span className="sr-only">Deletar matéria</span></>}
                            classNameBtn={`${ICON_BTN} hover:text-destructive`}
                            nameConfirmBtn="Excluir"
                            variantConfirmBtn={"destructive"}
                            onSubmit={handleSubjectFormDelete}
                        />
                    </div>
                </header>
                <p className="mt-3 text-sm text-muted-foreground">
                    Esta matéria não aparece nas revisões, no cronograma, no painel de desempenho nem nas anotações. Reative para voltar a usá-la.
                </p>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-4 sm:p-5">
            <header className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleExpanded}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Reduzir matéria" : "Expandir matéria"}
                        title={isExpanded ? "Reduzir" : "Expandir"}
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                        {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                    </button>
                    <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                    />
                    <h2 className="truncate text-base font-semibold">{subject.title}</h2>
                    {!isExpanded && (
                        <Badge variant="secondary" title="Assuntos nesta matéria">
                            {topics.filter((topic) => !topic.isContainer).length}
                        </Badge>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                    <Link
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                        href={`/materias/${subject?.id}`}
                        aria-label="Abrir página da matéria"
                        title="Abrir página da matéria"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Link>

                    <DialogDemo
                        title="Editar a matéria"
                        description="Modifique os detalhes desta matéria."
                        contentBtn={<><PencilLine size={15} /><span className="sr-only">Editar matéria</span></>}
                        classNameBtn={ICON_BTN}
                        onSubmit={handleSubjectFormSubmit}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                    >
                        <FieldGroup>
                            <Field>
                                <Label>Nome</Label>
                                <Input
                                    name="title"
                                    defaultValue={subject.title}
                                    disabled={isPending}
                                />
                            </Field>
                            <Field>
                                <Label>Cor</Label>
                                <ColorPicker value={draftColor} onChange={setDraftColor} />
                            </Field>
                        </FieldGroup>
                    </DialogDemo>

                    <SubjectActiveToggle subjectId={subject.id} active={true} />

                    <DialogDemo
                        title="Deletar matéria"
                        description="Tem certeza que deseja deletar a matéria? Esta ação é irreversível."
                        contentBtn={<><Trash2 size={15} /><span className="sr-only">Deletar matéria</span></>}
                        classNameBtn={`${ICON_BTN} hover:text-destructive`}
                        nameConfirmBtn="Excluir"
                        variantConfirmBtn={"destructive"}
                        onSubmit={handleSubjectFormDelete}
                    />
                </div>
            </header>

            {isExpanded && (
                <div className="mt-3 flex flex-col">
                    <div className="flex flex-col divide-y divide-border">
                        {topics.map((topic, index) => {
                            const meta = getTopicMeta(topic.id);

                            return (
                                <TopicRow
                                    key={topic.id || `topic-${index}`}
                                    topic={topic}
                                    index={index}
                                    isFirst={meta.isFirst}
                                    isLast={meta.isLast}
                                    isSubtopic={meta.isSubtopic}
                                    childCount={meta.childCount}
                                    subject={subject}
                                    isReordering={isReordering}
                                    dragProps={getDragProps(topic.id)}
                                    isDragging={draggedId === topic.id}
                                    isDragOver={overId === topic.id}
                                    onMoveUp={() => moveTopic(topic.id, "up")}
                                    onMoveDown={() => moveTopic(topic.id, "down")}
                                />
                            );
                        })}
                    </div>
                    <TopicDragGhost ghost={ghost} elementRef={ghostRef} />
                    {topics.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            Nenhum assunto ainda. Adicione o primeiro abaixo.
                        </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                        <Input className="min-w-0 flex-1" placeholder="Adicione um assunto" aria-label="Novo assunto" onChange={(e) => (setTopicTitle(e.target.value))} />
                        <Button variant="outline" size="icon" className="shrink-0" aria-label="Adicionar assunto" onClick={handleSubjectCreate}>
                            <Plus size={15} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function SubjectBoxSkeleton() {
    return (
        <div className="glass rounded-2xl p-4 sm:p-5">
            <header className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="size-2.5 shrink-0 rounded-full" />
                    <Skeleton className="h-5 w-40" />
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="size-5 rounded-md" />
                    <Skeleton className="size-5 rounded-md" />
                </div>
            </header>

            <div className="mt-3 flex flex-col">
                <div className="flex flex-col divide-y divide-border">
                    <TopicRowSkeleton />
                    <TopicRowSkeleton />
                    <TopicRowSkeleton />
                </div>

                <div className="mt-3 flex flex-row gap-2">
                    <Input className="min-w-0 flex-1" placeholder="Adicione um assunto" aria-label="Novo assunto" disabled />
                    <Button variant="outline" size="icon" className="shrink-0" aria-label="Adicionar assunto" disabled><Plus size={15} /></Button>
                </div>
            </div>
        </div>
    );
}

function TopicRowSkeleton() {
    return (
        <div className="flex h-11 w-full items-center gap-3 px-2">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-3/4 max-w-62.5" />
            <div className="ml-auto flex shrink-0 items-center gap-2">
                <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="size-5 rounded-md" />
            </div>
        </div>
    );
}

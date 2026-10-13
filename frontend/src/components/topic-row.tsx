"use client";

import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, ChevronRight, Clock, Eye, FileText, FolderOpen, GripVertical, Link as LinkLucide, ListPlus, Paperclip, PencilLine, Plus, Trash2 } from "lucide-react";

import { RefObject, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import { createTopicAction, deleteTopicAction, openTopicAttachmentAction, sendattachmentPDFAction, updateTopicAction } from "@/actions/topics.actions";
import { TopicDragGhostData, TopicDragProps } from "@/hooks/use-topic-reorder";
import { Subject } from "@/types/subject";
import { Topic, TopicStatus } from "@/types/topic";

function formatDateForInput(dateSource: string | Date | null): string {
    if (!dateSource) {
        return '';
    }
    try {
        const date = new Date(dateSource);
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

/** Cópia flutuante do assunto que aparece "na mão" enquanto ele é arrastado. */
export function TopicDragGhost({
    ghost,
    elementRef,
}: {
    ghost: TopicDragGhostData | null;
    elementRef: RefObject<HTMLDivElement | null>;
}) {
    if (!ghost) return null;

    const { topic, width, left, top } = ghost;

    // Portal no <body>: evita que um pai com transform/animação quebre o position: fixed.
    return createPortal(
        <div
            ref={elementRef}
            style={{
                position: "fixed",
                left: 0,
                top: 0,
                width,
                zIndex: 9999,
                pointerEvents: "none",
                transform: `translate3d(${left}px, ${top}px, 0) scale(1.02)`,
            }}
            className="flex cursor-grabbing items-center gap-3 rounded-lg border border-primary bg-card px-3 py-2 text-sm shadow-2xl"
        >
            <GripVertical size={16} className="shrink-0 text-primary" />
            {topic.isContainer ? (
                <FolderOpen size={15} className="shrink-0 text-muted-foreground" />
            ) : topic.status === "CONCLUIDO" ? (
                <CheckCircle2 size={15} className="shrink-0 text-green-500" />
            ) : (
                <Clock size={15} className="shrink-0 text-destructive" />
            )}
            <span className="truncate font-medium">{topic.title}</span>
        </div>,
        document.body
    );
}

type SubjectBoxProps = {
    subject: Subject;
    onStatusChange?: (topic: Topic, newStatus: TopicStatus) => void;
    onEditTopic?: (topicId: string, title: string, link: string, review1: string) => void;
    onUpdate?: () => void;
};

type TopicRowProps = {
    topic: Topic;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    subject: Subject;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isReordering?: boolean;
    dragProps?: TopicDragProps;
    isDragging?: boolean;
    isDragOver?: boolean;
    /** true quando o item é um subassunto (aparece recuado e não aceita subassuntos). */
    isSubtopic?: boolean;
    /** Quantos subassuntos este assunto tem (usado no aviso ao excluir). */
    childCount?: number;
} & Omit<SubjectBoxProps, "subject">;

export function TopicRow({
    topic,
    index,
    isFirst,
    isLast,
    subject,
    onMoveUp,
    onMoveDown,
    isReordering = false,
    dragProps,
    isDragging = false,
    isDragOver = false,
    isSubtopic = false,
    childCount = 0,
}: TopicRowProps) {
    // Assunto com subassuntos: só organiza (sem status, revisões, anexos, link ou questões próprias).
    const isContainer = !!topic.isContainer;
    const hasAttachments = !isContainer && topic.attachments && topic.attachments.length > 0;
    const [editedTitle, setEditedTitle] = useState(topic.title);
    const [editedLink, setEditedLink] = useState((topic as Topic).link || '');
    const [editedFirstReviewDate, setEditedFirstReviewDate] = useState('');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(true);
    const [subtopicTitle, setSubtopicTitle] = useState('');
    const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);

    const handleSubtopicSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const title = subtopicTitle.trim();
        if (!title) return;

        try {
            toast.loading("Criando subassunto...", { id: "create-subtopic" });
            const formData = new FormData()
            formData.append("title", title)
            formData.append("subject_id", subject.id)
            formData.append("parent_id", topic.id)
            const result = await createTopicAction(formData);

            if (result?.success) {
                toast.success("Subassunto criado!", { id: "create-subtopic" });
                setSubtopicTitle('');
                setIsSubtopicDialogOpen(false);
            } else {
                toast.error(result?.message || "Falha ao criar o subassunto!", { id: "create-subtopic" });
            }
        } catch (error) {
            toast.error("Falha ao criar o subassunto!", { id: "create-subtopic" });
            console.error("Erro:", error);
        }
    };


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        try {
            toast.loading("Enviando anexo...", { id: "attach-pdf" });
            const formData = new FormData()
            formData.append("topicId", topic.id)
            formData.append("file", file as File)
            await sendattachmentPDFAction(formData);
            toast.success("Anexo enviado!", { id: "attach-pdf" });
        } catch (error) {
            toast.error("Falha ao enviar o anexo!", { id: "attach-pdf" });
            console.error("Erro:", error);
        } finally {
            e.target.value = "";
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            toast.loading("Editando assunto...", { id: "edit-topic" });
            const formData = new FormData()
            formData.append("topicId", topic.id)
            formData.append("title", editedTitle)
            formData.append("link", editedLink)
            formData.append("review1", editedFirstReviewDate)
            formData.append("status", "null")
            await updateTopicAction(formData);
            toast.success("Assunto editado!", { id: "edit-topic" });
        } catch (error) {
            toast.error("Falha ao editar assunto!", { id: "edit-topic" });
            console.error("Erro:", error);
        } finally {
            setIsEditDialogOpen(false)
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setEditedTitle(topic.title);
            setEditedLink((topic as Topic).link || '');
            const firstReviewDate = topic.status === 'CONCLUIDO' ? new Date((topic as Topic).reviews?.first?.date) : null;
            setEditedFirstReviewDate(formatDateForInput(firstReviewDate));
        }
        setIsEditDialogOpen(open);
    };

    const handleTopicAttachmentOpen = async (attachmentPublicId: string) => {
        const newTab = window.open("about:blank", "_blank");

        try {
            toast.loading("Abrindo anexo...", { id: "open-attachment" });
            const formData = new FormData();
            formData.append("topicId", topic.id)
            formData.append("public_id", attachmentPublicId)

            const blob = (await openTopicAttachmentAction(formData)).blob

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
    }

    const handleTopicDelete = async (topicId: string) => {
        try {
            toast.loading("Deletando assunto...", { id: "delete-topic" });
            const formData = new FormData()
            formData.append("topicId", topicId)
            formData.append("subject_id", subject.id)
            await deleteTopicAction(formData);
            toast.success("Assunto deletado com sucesso", { id: "delete-topic" });
        } catch (error) {
            console.error("Falha ao deletar o assunto", error);
            toast.error("Falha ao deletar o assunto", { id: "delete-topic" });
        }
    };

    async function handleTopicStatusChange(topic: Topic, newStatus: TopicStatus) {
        try {
            toast.loading("Atualizando status do assunto...", { id: "update-status-topic" });
            const formData = new FormData()
            formData.append("topicId", topic.id)
            formData.append("title", topic.title)
            formData.append("link", topic.link || "")
            formData.append("review1", topic.reviews.first.date)
            formData.append("status", newStatus)
            await updateTopicAction(formData);
            toast.success("Status do assunto atualizado!", { id: "update-status-topic" });
        } catch (error) {
            toast.error("Falha ao atualizar o status.", { id: "update-status-topic" });
            console.error("Erro:", error);
        }
    }

    const kind = isSubtopic ? "Subassunto" : "Assunto";

    return (
        // Subassunto fica recuado com uma linha lateral, para ficar claro de qual assunto ele faz parte.
        <div
            className={`flex flex-col gap-2 ${isSubtopic
                    ? "ml-4 border-l-2 pl-2 sm:ml-8 sm:pl-3 border-dotted"
                    : ""
                }`}
            style={
                isSubtopic
                    ? { borderLeftColor: topic.subject.color }
                    : undefined
            }
        >
            <div
                {...dragProps?.rowProps}
                className={`hoverComponents flex w-full items-center justify-between gap-2 rounded-lg border border-base-content/10 py-1 px-3 text-sm transition-opacity ${isDragging ? "opacity-40" : ""} ${isDragOver && !isDragging ? "ring-2 ring-primary" : ""}`}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {dragProps && (
                        <span
                            {...dragProps.handleProps}
                            title="Arraste para mudar a ordem"
                            aria-label="Arrastar para reordenar"
                            className={`flex shrink-0 touch-none select-none items-center text-muted-foreground transition-colors hover:text-primary ${isReordering ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"}`}
                        >
                            <GripVertical size={16} />
                        </span>
                    )}
                    {/* <div className="flex flex-col">
                        <button
                            type="button"
                            onClick={onMoveUp}
                            disabled={isFirst || isReordering || !onMoveUp}
                            aria-label="Mover para cima"
                            className="btn btn-ghost btn-xs h-5 w-5 cursor-pointer p-0 hover:text-primary disabled:bg-transparent disabled:text-base-content/20"
                        >
                            <ArrowUp size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={onMoveDown}
                            disabled={isLast || isReordering || !onMoveDown}
                            aria-label="Mover para baixo"
                            className="btn btn-ghost btn-xs h-4 w-4 min-h-0 cursor-pointer p-0 hover:text-primary disabled:bg-transparent disabled:text-base-content/10"
                        >
                            <ArrowDown size={15} />
                        </button>
                    </div> */}

                    {isContainer ? (
                        <FolderOpen color={topic.subject.color} size={15} className="shrink-0 text-muted-foreground" />
                    ) : topic.status === "CONCLUIDO" ? (
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
                        {isContainer && (
                            <span
                                className="shrink-0 rounded-sm border px-1.5 py-0.5 text-xs text-muted-foreground"
                                title={`${topic.subtopicsDone ?? 0} de ${topic.subtopicsTotal ?? 0} subassuntos concluídos`}
                            >
                                {topic.subtopicsDone ?? 0}/{topic.subtopicsTotal ?? 0}
                            </span>
                        )}

                        {!isContainer && (
                            <>
                        {/* Mobile */}
                        <select
                            value={topic.status}
                            onChange={(e) => handleTopicStatusChange?.(topic, e.target.value as TopicStatus)}
                            aria-label="Status do tópico"
                            className="select select-bordered select-xs hover:cursor-pointer md:hidden border rounded-sm p-0.5  max-w-10"
                        >
                            <option value="PENDENTE">✖</option>
                            <option value="CONCLUIDO">✔</option>
                        </select>

                        {/* Desktop */}
                        <select
                            value={topic.status}
                            onChange={(e) => handleTopicStatusChange?.(topic, e.target.value as TopicStatus)}
                            aria-label="Status do tópico"
                            className="select select-bordered select-sm hover:cursor-pointer max-md:hidden border rounded-sm p-0.5  "
                        >
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="CONCLUIDO">CONCLUÍDO</option>
                        </select>

                        <DialogDemo
                            contentBtn={<Eye className="h-4 w-4" />}
                            title={topic.title}
                            description="Informações do assunto"
                            disableBtns={true}
                        >
                            <TopicInfoGroup
                                subject={subject.title}
                                topic={topic}
                                color={subject.color}
                                hasAttachments={hasAttachments}
                            />
                        </DialogDemo>

                        {topic.link && (
                            <a
                                href={topic.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-xs p-1 hover:text-primary sm:btn-sm"
                            >
                                <LinkLucide color={topic.subject.color} size={15} />
                            </a>
                        )}

                        <label
                            className="btn btn-ghost btn-xs cursor-pointer p-1 transition-colors hover:text-primary sm:btn-sm"
                            title="Anexar PDF"
                            htmlFor={`file-upload-${topic.id}`}
                        >
                            <input
                                accept=".pdf"
                                className="hidden"
                                type="file"
                                onChange={handleFileChange}
                                id={`file-upload-${topic.id}`}
                            />
                            <Paperclip size={15} />
                        </label>

                            </>
                        )}

                        {!isSubtopic && (
                            <DialogDemo
                                title="Novo subassunto"
                                description={`Adicione um subassunto em "${topic.title}".`}
                                contentBtn={<span title="Adicionar subassunto" className="flex"><Plus size={15} /></span>}
                                classNameBtn="border-0 bg-transparent dark:bg-transparent hover:dark:bg-transparent p-1 m-0 hover:text-primary p-0 m-0"
                                nameConfirmBtn="Adicionar"
                                onSubmit={handleSubtopicSubmit}
                                open={isSubtopicDialogOpen}
                                onOpenChange={setIsSubtopicDialogOpen}
                            >
                                <FieldGroup>
                                    <Field>
                                        <Label htmlFor={`subtopic-title-${topic.id}`}>Título</Label>
                                        <Input
                                            id={`subtopic-title-${topic.id}`}
                                            value={subtopicTitle}
                                            onChange={(e) => setSubtopicTitle(e.target.value)}
                                            placeholder="Nome do subassunto"
                                            required
                                        />
                                    </Field>
                                </FieldGroup>
                            </DialogDemo>
                        )}

                        <DialogDemo
                            title={`Editar ${kind}`}
                            description={`Modifique os detalhes deste ${kind.toLowerCase()}.`}
                            contentBtn={<PencilLine className="" size={15} />}
                            classNameBtn="border-0 bg-transparent dark:bg-transparent hover:dark:bg-transparent p-1 m-0 hover:text-primary"
                            nameConfirmBtn="Editar"
                            onSubmit={handleEditSubmit}
                            open={isEditDialogOpen}
                            onOpenChange={handleOpenChange}
                        >
                            <FieldGroup>
                                <Field>
                                    <Label htmlFor="topic-title">Título</Label>
                                    <Input
                                        id="topic-title"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                    />
                                </Field>
                                {!isContainer && (
                                <Field>
                                    <Label className="flex gap-1" htmlFor="topic-link">Link<span className="p-0 m-0 text-card-foreground/40">(Opcional)</span> </Label>
                                    <Input
                                        id="topic-link"
                                        value={editedLink}
                                        onChange={(e) => setEditedLink(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </Field>
                                )}
                                {!isContainer && topic.status === 'CONCLUIDO' && (
                                    <Field>
                                        <label htmlFor="topic-first-review-date">Data da primeira revisão </label>
                                        <Input
                                            type="date"
                                            id="topic-first-review-date"
                                            value={editedFirstReviewDate}
                                            onChange={(e) => setEditedFirstReviewDate(e.target.value)}
                                        />
                                    </Field>
                                )}
                            </FieldGroup>
                        </DialogDemo>

                        <DialogDemo
                            title={`Excluir ${kind}`}
                            description={`Tem certeza que deseja deletar este ${kind.toLowerCase()}? Esta ação é irreversível.${childCount > 0 ? ` Os ${childCount} subassunto${childCount > 1 ? "s" : ""} dele também ${childCount > 1 ? "serão excluídos" : "será excluído"}.` : ""}`}
                            contentBtn={<Trash2 className="" size={15} />}
                            classNameBtn="border-0 bg-transparent dark:bg-transparent hover:dark:bg-transparent p-1 m-0 hover:text-destructive"
                            nameConfirmBtn="Excluir"
                            variantConfirmBtn={"destructive"}
                            onSubmit={(e) => { e.preventDefault(); handleTopicDelete(topic.id); }}
                        >
                        </DialogDemo>
                    </div>
                </div>
            </div>

            {hasAttachments && (
                <div className="flex flex-col gap-1 px-2 py-1">
                    <button
                        type="button"
                        onClick={() => setIsAttachmentsOpen((open) => !open)}
                        aria-expanded={isAttachmentsOpen}
                        aria-label={isAttachmentsOpen ? "Reduzir anexos" : "Expandir anexos"}
                        className="flex w-fit cursor-pointer items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {isAttachmentsOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        Anexos ({topic.attachments!.length})
                    </button>
                    {isAttachmentsOpen && topic.attachments!.map((attachment, index) => (
                        <span
                            key={attachment.id || index}
                            onClick={() => handleTopicAttachmentOpen(attachment.public_id!)}
                            className="flex items-center rounded-sm border p-1 text-sm truncate hover:bg-secondary transition-colors cursor-pointer animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <FileText color={topic.subject.color} size={15} className="mr-2 shrink-0" />
                            {attachment.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
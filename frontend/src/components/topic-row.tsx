"use client";

import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronDown, ChevronRight, Clock, Eye, FileText, FolderOpen, GripVertical, Link as LinkLucide, ListPlus, Paperclip, PencilLine, Plus, Trash2 } from "lucide-react";

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
            className="glass-strong flex cursor-grabbing items-center gap-3 rounded-xl px-3 py-2 text-sm ring-1 ring-primary/50"
        >
            <GripVertical size={16} className="shrink-0 text-primary" />
            {topic.isContainer ? (
                <FolderOpen size={15} className="shrink-0 text-muted-foreground" />
            ) : topic.status === "CONCLUIDO" ? (
                <CheckCircle2 size={15} className="shrink-0 text-primary" />
            ) : (
                <Clock size={15} className="shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-medium">{topic.title}</span>
        </div>,
        document.body
    );
}

/** Botão de ícone discreto: sem moldura, só preenchimento ao passar o mouse. */
const ICON_BTN =
    "size-7 rounded-lg border-transparent bg-transparent p-0 text-muted-foreground shadow-none backdrop-blur-none hover:bg-foreground/8 hover:text-foreground aria-expanded:bg-foreground/8";
const ICON_LINK =
    "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none has-focus-visible:ring-3 has-focus-visible:ring-ring/40";
const STATUS_SELECT =
    "h-7 cursor-pointer rounded-full border border-input bg-foreground/4 text-xs text-foreground outline-none transition-colors duration-150 hover:bg-foreground/8 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 [&>option]:bg-background [&>option]:text-foreground";

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
            className={`flex flex-col ${isSubtopic
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
                className={`border flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-foreground/6 ${isDragging ? "opacity-40" : ""} ${isDragOver && !isDragging ? "ring-2 ring-primary" : ""}`}
            >
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

                {isContainer ? (
                    <FolderOpen color={topic.subject.color} size={15} className="shrink-0 text-muted-foreground" />
                ) : topic.status === "CONCLUIDO" ? (
                    <CheckCircle2 size={15} className="shrink-0 text-primary" aria-label="Concluído" />
                ) : (
                    <Clock size={15} className="shrink-0 text-muted-foreground" aria-label="Pendente" />
                )}

                <span
                    className="block min-w-0 flex-1 truncate text-left font-medium"
                    title={topic.title}
                >
                    {topic.title}
                </span>

                <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                    {isContainer && (
                        <span
                            className="shrink-0 rounded-full bg-foreground/6 px-2 py-0.5 text-xs tabular-nums text-muted-foreground"
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
                                aria-label="Status do assunto"
                                className={`${STATUS_SELECT} w-9 appearance-none px-0 text-center md:hidden`}
                            >
                                <option value="PENDENTE">✖</option>
                                <option value="CONCLUIDO">✔</option>
                            </select>

                            {/* Desktop */}
                            <select
                                value={topic.status}
                                onChange={(e) => handleTopicStatusChange?.(topic, e.target.value as TopicStatus)}
                                aria-label="Status do assunto"
                                className={`${STATUS_SELECT} mr-1 px-2.5 max-md:hidden`}
                            >
                                <option value="PENDENTE">Pendente</option>
                                <option value="CONCLUIDO">Concluído</option>
                            </select>

                            <DialogDemo
                                contentBtn={<><Eye className="h-4 w-4" /><span className="sr-only">Ver informações</span></>}
                                classNameBtn={ICON_BTN}
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
                                    className={ICON_LINK}
                                    aria-label="Abrir link do assunto"
                                    title="Abrir link"
                                >
                                    <LinkLucide size={15} />
                                </a>
                            )}

                            <label
                                className={ICON_LINK}
                                title="Anexar PDF"
                                htmlFor={`file-upload-${topic.id}`}
                            >
                                <input
                                    accept=".pdf"
                                    className="sr-only"
                                    type="file"
                                    onChange={handleFileChange}
                                    id={`file-upload-${topic.id}`}
                                    aria-label="Anexar PDF"
                                />
                                <Paperclip size={15} />
                            </label>
                        </>
                    )}

                    {!isSubtopic && (
                        <DialogDemo
                            title="Novo subassunto"
                            description={`Adicione um subassunto em "${topic.title}".`}
                            contentBtn={<span title="Adicionar subassunto" className="flex"><Plus size={15} /><span className="sr-only">Adicionar subassunto</span></span>}
                            classNameBtn={ICON_BTN}
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
                        title={`Editar ${kind.toLowerCase()}`}
                        description={`Modifique os detalhes deste ${kind.toLowerCase()}.`}
                        contentBtn={<><PencilLine size={15} /><span className="sr-only">Editar {kind.toLowerCase()}</span></>}
                        classNameBtn={ICON_BTN}
                        nameConfirmBtn="Salvar"
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
                                    <Label className="flex gap-1" htmlFor="topic-link">Link<span className="text-muted-foreground">(opcional)</span></Label>
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
                                    <Label htmlFor="topic-first-review-date">Data da primeira revisão</Label>
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
                        title={`Excluir ${kind.toLowerCase()}`}
                        description={`Tem certeza que deseja deletar este ${kind.toLowerCase()}? Esta ação é irreversível.${childCount > 0 ? ` Os ${childCount} subassunto${childCount > 1 ? "s" : ""} dele também ${childCount > 1 ? "serão excluídos" : "será excluído"}.` : ""}`}
                        contentBtn={<><Trash2 size={15} /><span className="sr-only">Excluir {kind.toLowerCase()}</span></>}
                        classNameBtn={`${ICON_BTN} hover:text-destructive`}
                        nameConfirmBtn="Excluir"
                        variantConfirmBtn={"destructive"}
                        onSubmit={(e) => { e.preventDefault(); handleTopicDelete(topic.id); }}
                    >
                    </DialogDemo>
                </div>
            </div>

            {hasAttachments && (
                <div className="flex flex-col gap-0.5 pb-1.5 pl-8 pr-2">
                    <button
                        type="button"
                        onClick={() => setIsAttachmentsOpen((open) => !open)}
                        aria-expanded={isAttachmentsOpen}
                        aria-label={isAttachmentsOpen ? "Reduzir anexos" : "Expandir anexos"}
                        className="flex w-fit cursor-pointer items-center gap-1 rounded-md py-0.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                        {isAttachmentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        Anexos ({topic.attachments!.length})
                    </button>
                    {isAttachmentsOpen && topic.attachments!.map((attachment, index) => (
                        <button
                            type="button"
                            key={attachment.id || index}
                            onClick={() => handleTopicAttachmentOpen(attachment.public_id!)}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition-colors duration-150 hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            <FileText color={topic.subject.color} size={14} className="shrink-0" />
                            <span className="truncate">{attachment.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

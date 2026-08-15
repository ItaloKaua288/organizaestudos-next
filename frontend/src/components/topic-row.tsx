"use client";

import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Eye, FileText, Link as LinkLucide, Paperclip, PencilLine, Trash2 } from "lucide-react";

import { useState } from "react";
import toast from "react-hot-toast";

import { deleteTopicAction, openTopicAttachmentAction, sendattachmentPDFAction, updateTopicAction } from "@/actions/topics.actions";
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
} & Omit<SubjectBoxProps, "subject">;

export function TopicRow({
    topic,
    index,
    isFirst,
    isLast,
    subject,
}: TopicRowProps) {
    const hasAttachments = topic.attachments && topic.attachments.length > 0;
    const [editedTitle, setEditedTitle] = useState(topic.title);
    const [editedLink, setEditedLink] = useState((topic as Topic).link || '');
    const [editedFirstReviewDate, setEditedFirstReviewDate] = useState('');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


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

    const handleMoveUp = async () => { }

    const handleMoveDown = async () => { }

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

    return (
        <>
            <div className="hoverComponents flex w-full items-center justify-between gap-2 rounded-lg border border-base-content/10 py-1 px-3 text-sm ">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex flex-col">
                        <button
                            type="button"
                            onClick={handleMoveUp}
                            disabled={isFirst}
                            aria-label="Mover para cima"
                            className="btn btn-ghost btn-xs h-5 w-5 cursor-pointer p-0 hover:text-primary disabled:bg-transparent disabled:text-base-content/20"
                        >
                            <ArrowUp size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={handleMoveDown}
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

                        <DialogDemo
                            title="Editar Assunto"
                            description="Modifique os detalhes deste assunto."
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
                                <Field>
                                    <Label className="flex gap-1" htmlFor="topic-link">Link<span className="p-0 m-0 text-card-foreground/40">(Opcional)</span> </Label>
                                    <Input
                                        id="topic-link"
                                        value={editedLink}
                                        onChange={(e) => setEditedLink(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </Field>
                                {topic.status === 'CONCLUIDO' && (
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
                            title="Excluir Assunto"
                            description="Tem certeza que deseja deletar este assunto? Esta ação é irreversível."
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
                    <h3 className="text-sm font-semibold text-muted-foreground">Anexos:</h3>
                    {topic.attachments!.map((attachment, index) => (
                        <span
                            key={attachment.id || index}
                            onClick={() => handleTopicAttachmentOpen(attachment.public_id!)}
                            className="flex items-center rounded-sm border p-1 text-sm truncate hover:bg-secondary transition-colors cursor-pointer"
                        >
                            <FileText color={topic.subject.color} size={15} className="mr-2 shrink-0" />
                            {attachment.name}
                        </span>
                    ))}
                </div>
            )}
        </>
    );
}
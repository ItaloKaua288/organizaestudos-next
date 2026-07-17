"use client";

import { ArrowUp, ArrowDown, CheckCircle2, Paperclip, PencilLine, Trash2, Eye, FileText, Clock } from "lucide-react";
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group"
import { Topic, TopicStatus } from "@/types/topic";


type SubjectBoxProps = {
    subject: string;
    color: string;
    topics: Topic[];
    onStatusChange?: (topicId: string, newStatus: TopicStatus) => void;
    onMoveUp?: (index: number) => void;
    onMoveDown?: (index: number) => void;
    onAttachPDF?: (topicId: string, file: File) => void;
    onEditTopic?: (topicId: string) => void;
    onDeleteTopic?: (topicId: string) => void;
};

export default function SubjectBox({ subject, color, topics, onStatusChange, onMoveUp, onMoveDown, onAttachPDF: onAttachPDF, onEditTopic, onDeleteTopic }: SubjectBoxProps) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, topicId: string) => {
        const file = e.target.files?.[0];
        if (file && onAttachPDF)
            onAttachPDF(topicId, file);
    }

    return (
        <div className="border p-1.5 rounded-lg">
            <header className="flex items-center gap-2 mb-2">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true"></span>
                <h2 className="font-bold text-md">{subject}</h2>
            </header>

            <div className="flex flex-col gap-1.5">
                {topics.map((topic, index) => {
                    const isFirst = index === 0;
                    const isLast = index === topics.length - 1;
                    const hasAttachments = topic.attachments && topic.attachments.length > 0;

                    return (
                        <div key={topic.id}>
                            <div
                                className="w-full bg-base-200/60 py-2 pl-3 pr-2 border border-base-content/10 text-sm flex justify-between items-center gap-2 rounded-lg hover:bg-base-200 transition-colors"
                            >
                                <div className="flex gap-3 items-center min-w-0 flex-1">
                                    <div className="flex flex-col">
                                        <button
                                            type="button"
                                            onClick={() => onMoveUp?.(index)}
                                            disabled={isFirst}
                                            aria-label="Mover para cima"
                                            className="btn btn-xs btn-ghost hover:text-primary cursor-pointer w-5 h-5 p-0 disabled:bg-transparent disabled:text-base-content/20"
                                        >
                                            <ArrowUp size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onMoveDown?.(index)}
                                            disabled={isLast}
                                            aria-label="Mover para baixo"
                                            className="btn btn-sm btn-ghost hover:text-primary cursor-pointer w-4 h-4 min-h-0 p-0 disabled:bg-transparent disabled:text-base-content/10"
                                        >
                                            <ArrowDown size={15} />
                                        </button>
                                    </div>

                                    {topic.status === "CONCLUIDO"
                                        ? <CheckCircle2 size={15} className="shrink-0 text-green-500" aria-hidden="true" />
                                        : <Clock size={15} className="shrink-0 text-red-400" aria-hidden="true" />
                                    }

                                    <span
                                        className="font-medium truncate block w-full text-left max-w-50 sm:max-w-xs md:max-w-md lg:max-w-lg"
                                        title={topic.title}
                                    >
                                        {topic.title}
                                    </span>

                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                                        <select
                                            value={topic.status}
                                            onChange={(e) => onStatusChange?.(topic.id, e.target.value as TopicStatus)}
                                            aria-label="Status do tópico"
                                            className="select select-bordered select-xs border rounded-md p-1 sm:select-sm hover:cursor-pointer text-xs"
                                        >
                                            <option value="PENDENTE">PENDENTE</option>
                                            <option value="CONCLUIDO">CONCLUÍDO</option>
                                        </select>

                                        <DialogDemo
                                            contentBtn={<Eye className="w-4 h-4" />}
                                            title={topic.title}
                                            description={"Informações do assunto"}
                                        >
                                            <TopicInfoGroup subject={subject} topic={topic} color={color} hasAttachments={hasAttachments} />
                                        </DialogDemo>
                                        <label
                                            className="btn btn-xs sm:btn-sm btn-ghost p-1 cursor-pointer hover:text-primary transition-colors"
                                            title="Anexar PDF"
                                            aria-label="Anexar PDF"
                                        >
                                            <input
                                                accept=".pdf"
                                                className="hidden"
                                                type="file"
                                                onChange={(e) => handleFileChange(e, topic.id)}
                                            />
                                            <Paperclip size={15} />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => onEditTopic?.(topic.id)}
                                            className="btn btn-xs sm:btn-sm btn-ghost p-1 hover:text-primary"
                                            title="Editar Assunto"
                                            aria-label="Editar Assunto"
                                        >
                                            <PencilLine size={15} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onDeleteTopic?.(topic.id)}
                                            className="btn btn-xs sm:btn-sm btn-ghost p-1 hover:text-red-500"
                                            title="Deletar Assunto"
                                            aria-label="Deletar Assunto"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                {hasAttachments ? (
                                    <div className="flex flex-col px-2 py-1 gap-1">
                                        <h3 className="text-sm">Anexos:</h3>
                                        {topic.attachments?.map((attachment) => (
                                            <a key={attachment.id} href={attachment.url} className="flex items-center text-sm truncate border rounded-sm p-1 hover:bg-secondary">
                                                <FileText size={15} className="inline-block mr-1" />
                                                {attachment.name}
                                            </a>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

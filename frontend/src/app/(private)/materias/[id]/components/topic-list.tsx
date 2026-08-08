"use client"

import { TopicRow } from "@/components/topic-row";
import { deleteTopic, sendAttachPDF, updateTopic, updateTopicStatus } from "@/services/topics.service";
import { Subject } from "@/types/subject";
import { Topic, TopicStatus } from "@/types/topic";
import toast from "react-hot-toast";

interface TopicListProps {
    sortedTopics: Topic[];
    subject: Subject;
}

export function TopicList({ sortedTopics, subject }: TopicListProps) {
    const handleTopicDelete = async (topicId: string) => {
        try {
            toast.loading("Deletando assunto...", { id: "delete-topic" });
            await deleteTopic(topicId);
            toast.success("Assunto deletado com sucesso", { id: "delete-topic" });
        } catch (error) {
            console.error("Falha ao deletar o assunto", error);
            toast.error("Falha ao deletar o assunto", { id: "delete-topic" });
        }
    }

    const handleTopicStatusChange = async (topicId: string, status: TopicStatus) => {
        try {
            toast.loading("Atualizando status do assunto...", { id: "update-status-topic" });
            await updateTopicStatus(topicId, status);
            toast.success("Status do assunto atualizado!", { id: "update-status-topic" });
        } catch (error) {
            toast.error("Falha ao atualizar o status.", { id: "update-status-topic" });
            console.error("Erro:", error);
        }
    }

    const handleAttachPDF = async (topicId: string, file: File) => {
        try {
            toast.loading("Enviando anexo...", { id: "attach-pdf" });
            await sendAttachPDF(topicId, file);
            toast.success("Anexo enviado!", { id: "attach-pdf" });
        } catch (error) {
            toast.error("Falha ao enviar o anexo!", { id: "attach-pdf" });
            console.error("Erro:", error);
        }
    }

    const handleEditTopic = async (topicId: string, title: string, link: string, review1: string) => {
        try {
            toast.loading("Editando assunto...", { id: "edit-topic" });
            await updateTopic(topicId, title, link, review1);
            toast.success("Assunto editado!", { id: "edit-topic" });
        } catch (error) {
            toast.error("Falha ao editar assunto!", { id: "edit-topic" });
            console.error("Erro:", error);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {sortedTopics.map((topic, index) => (
                <TopicRow
                    key={topic.id || `topic-${index}`}
                    topic={topic}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === sortedTopics.length - 1}
                    subject={subject}
                    onMoveUp={() => console.log("Subir", index)}
                    onMoveDown={() => console.log("Descer", index)}
                    onStatusChange={handleTopicStatusChange}
                    onAttachPDF={handleAttachPDF}
                    onEditTopic={handleEditTopic}
                    onDeleteTopic={handleTopicDelete}
                />
            ))}
        </div>
    )
}
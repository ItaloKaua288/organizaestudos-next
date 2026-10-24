"use client";

import { updateTopicAction } from "@/actions/topics.actions";
import { KanbanTopicSheet } from "@/app/(private)/kanban/components/kanban-topic-sheet";
import { Button } from "@/components/ui/button";
import type { Topic, TopicStatus } from "@/types/topic";
import { useState } from "react";
import toast from "react-hot-toast";

/** Troca o status do assunto (mesma ação do quadro). A confirmação é pedida pelo próprio painel. */
export function useTopicStatusChange() {
    return async function changeTopicStatus(topic: Topic, newStatus: TopicStatus) {
        if (newStatus === topic.status) return;

        const toastId = "update-status-topic";

        try {
            toast.loading("Atualizando status do assunto...", { id: toastId });
            const formData = new FormData();
            formData.append("topicId", topic.id);
            formData.append("title", topic.title);
            formData.append("link", topic.link || "");
            formData.append("review1", topic.reviews.first.date);
            formData.append("status", newStatus);
            await updateTopicAction(formData);
            toast.success("Status do assunto atualizado!", { id: toastId });
        } catch {
            toast.error("Falha ao atualizar o status.", { id: toastId });
        }
    };
}

type TopicSheetTriggerProps = {
    topic: Topic;
    /** Classes do botão que abre o detalhe. */
    className?: string;
    /** Conteúdo do botão (a linha do assunto). */
    children: React.ReactNode;
};

/** Botão que abre o detalhe do assunto, o mesmo painel do kanban. */
export function TopicSheetTrigger({ topic, className, children }: TopicSheetTriggerProps) {
    const [open, setOpen] = useState(false);
    const changeTopicStatus = useTopicStatusChange();

    return (
        <>
            <Button type="button" variant="outline" aria-haspopup="dialog" className={className} onClick={() => setOpen(true)}>
                {children}
            </Button>
            <KanbanTopicSheet topic={topic} open={open} onOpenChange={setOpen} onMove={changeTopicStatus} manage />
        </>
    );
}

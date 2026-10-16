"use client";

import { KanbanTopicSheet } from "@/app/(private)/kanban/components/kanban-topic-sheet";
import { buttonVariants } from "@/components/ui/button";
import { useTopicStatusChange } from "@/components/topic-sheet-trigger";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Topic } from "@/types/topic";
import { BookText } from "lucide-react";
import Link from "next/link";

type TopicDetailDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: { id: string; title: string; color: string } | null;
    topic?: Topic;
};

/**
 * Detalhe do assunto a estudar de uma matéria do cronograma.
 * Usa o mesmo painel do kanban; sem assunto pendente, mostra só um aviso com o atalho da matéria.
 */
export function TopicDetailDialog({ open, onOpenChange, subject, topic }: TopicDetailDialogProps) {
    const changeTopicStatus = useTopicStatusChange();

    if (topic) {
        return <KanbanTopicSheet topic={topic} open={open} onOpenChange={onOpenChange} onMove={changeTopicStatus} manage />;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
                <DialogHeader
                    className="shrink-0 gap-3 px-5 pt-5 pb-4"
                    style={subject ? { backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, ${subject.color} 20%, transparent), transparent)` } : undefined}
                >
                    {subject && (
                        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                            <span className="truncate">{subject.title}</span>
                        </p>
                    )}
                    <DialogTitle className="text-xl leading-snug">Sem assunto pendente</DialogTitle>
                    <DialogDescription>Todos os assuntos desta matéria já foram concluídos ou ainda não foram cadastrados.</DialogDescription>
                </DialogHeader>

                {subject && (
                    <footer className="flex shrink-0 flex-wrap gap-2 border-t px-5 py-4">
                        <Link href={`/materias/${subject.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            <BookText aria-hidden />
                            Abrir matéria
                        </Link>
                    </footer>
                )}
            </DialogContent>
        </Dialog>
    );
}

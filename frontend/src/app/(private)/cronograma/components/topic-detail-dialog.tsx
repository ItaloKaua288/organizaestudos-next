"use client"

import { openTopicAttachmentAction } from "@/actions/topics.actions";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Topic } from "@/types/topic";
import { FileText, Paperclip } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type TopicDetailDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: { id: string; title: string; color: string } | null;
    topic?: Topic;
};

/** Mostra o assunto a ser estudado de uma matéria, igual ao detalhe do cronograma semanal. */
export function TopicDetailDialog({ open, onOpenChange, subject, topic }: TopicDetailDialogProps) {
    const attachments = topic?.attachments ?? [];

    const handleAttachmentOpen = async (publicId: string) => {
        if (!topic) return;
        const newTab = window.open("about:blank", "_blank");

        try {
            toast.loading("Abrindo anexo...", { id: "open-attachment" });
            const formData = new FormData();
            formData.append("topicId", topic.id);
            formData.append("public_id", publicId);

            const blob = (await openTopicAttachmentAction(formData)).blob;

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
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{topic ? topic.title : "Sem assunto pendente"}</DialogTitle>
                    <DialogDescription>
                        {topic ? "Assunto a ser estudado" : "Todos os assuntos desta matéria já foram concluídos ou ainda não foram cadastrados."}
                    </DialogDescription>
                </DialogHeader>

                {subject && (
                    <div className="space-y-4 min-w-0 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Matéria</span>
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                            <span className="truncate">{subject.title}</span>
                        </div>

                        {topic && (
                            <div>
                                <span className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Paperclip className="h-4 w-4" /> Anexos <Badge variant="secondary">{attachments.length}</Badge>
                                </span>
                                {attachments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sem anexos.</p>
                                ) : (
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        {attachments.map((attachment) => (
                                            <button
                                                key={attachment.id}
                                                type="button"
                                                onClick={() => attachment.public_id && handleAttachmentOpen(attachment.public_id)}
                                                className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                            >
                                                <FileText className="h-4 w-4 shrink-0" style={{ color: subject.color }} />
                                                <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Link href={`/materias/${subject.id}`} className="inline-block rounded-md text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                            Abrir matéria
                        </Link>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

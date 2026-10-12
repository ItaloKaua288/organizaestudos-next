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
                            <span className="font-semibold">Matéria:</span>
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                            <span className="truncate">{subject.title}</span>
                        </div>

                        {topic && (
                            <div>
                                <span className="text-sm font-semibold flex items-center gap-1 mb-2">
                                    <Paperclip className="h-4 w-4" /> Anexos: <Badge variant="secondary">{attachments.length}</Badge>
                                </span>
                                {attachments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Sem anexos.</p>
                                ) : (
                                    <div className="flex flex-col gap-2 min-w-0">
                                        {attachments.map((attachment) => (
                                            <button
                                                key={attachment.id}
                                                type="button"
                                                onClick={() => attachment.public_id && handleAttachmentOpen(attachment.public_id)}
                                                className="flex gap-2 items-center w-full min-w-0 border hoverComponentsStatic p-0.5 rounded-sm text-left text-sm cursor-pointer transition-colors"
                                            >
                                                <FileText className="h-4 w-4 shrink-0" style={{ color: subject.color }} />
                                                <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Link href={`/materias/${subject.id}`} className="inline-block text-sm text-primary hover:underline">
                            Abrir matéria
                        </Link>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

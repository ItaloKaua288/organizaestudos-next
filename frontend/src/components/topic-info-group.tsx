import { FileText } from "lucide-react";
import { Field, FieldGroup } from "./ui/field";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Topic } from "./subject-box";

type TopicInfoDialogProps = {
    subject: string;
    topic: Topic;
    color: string;
    hasAttachments: boolean | undefined;
}

export function TopicInfoGroup({ subject, topic, color, hasAttachments }: TopicInfoDialogProps) {
    return (
        <FieldGroup>
            <Field className="flex flex-row gap-2 items-center">
                <Label htmlFor="description-1">
                    Matéria:
                    <span className="w-4 h-4 rounded-full shrink-0 inline-block ml-1 align-middle" style={{ backgroundColor: color }} aria-hidden="true"></span>
                    <span className="ml-1 font-semibold truncate">
                        {subject}
                    </span>
                </Label>
            </Field>
            <Field>
                <Label>
                    Status:
                    <Badge className="ml-2" {...(topic.status === "CONCLUIDO" ? { variant: "secondary" } : {})}>{topic.status}</Badge>
                </Label>
            </Field>
            <Field>
                <Label>Cronograma de Revisões:</Label>
                <div className="grid grid-cols-2 border rounded-lg p-2 gap-1 text-xs sm:text-sm bg-neutral-800/50">
                    <span>1° Revisão (24h): </span>
                    <span className="text-right font-mono">18/06/2026</span>
                    <span>2° Revisão (7 dias): </span>
                    <span className="text-right font-mono">18/06/2026</span>
                    <span>3° Revisão (30 dias): </span>
                    <span className="text-right font-mono">18/06/2026</span>
                </div>
            </Field>
            <Field>
                <Label>Anexos ({topic.attachments?.length || 0}):</Label>
                {hasAttachments ? (
                    <div className="flex flex-col gap-2 max-h-50 overflow-auto transition-colors">
                        {topic.attachments?.map((attachment) => (
                            <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm border p-1 hover:bg-secondary truncate w-full rounded-sm"
                            >
                                <FileText size={15} className="inline-block mr-1" />
                                {attachment.name}
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-base-content/50 italic mt-1">Nenhum PDF anexado.</p>
                )}
            </Field>
        </FieldGroup>
    )
}
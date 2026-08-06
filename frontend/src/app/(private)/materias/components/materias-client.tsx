"use client"

import SubjectBox, { SubjectBoxSkeleton } from "@/app/(private)/materias/components/subject-box";
import { DialogDemo } from "@/components/dialog-button";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSubject } from "@/services/subjects.service";
import { sendAttachPDF, updateTopic, updateTopicStatus } from "@/services/topics.service";
import { Subject } from "@/types/subject";
import { Topic, TopicStatus } from "@/types/topic";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

type SubjectWithTopics = Subject & { topics: Topic[] };

interface MateriasClientProps {
    subjects: SubjectWithTopics[];
}

export default function MateriasClient({ subjects }: MateriasClientProps) {
    const router = useRouter();
    const [color, setColor] = useState("#3b82f6");
    const [title, setTitle] = useState("");
    const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false)

    async function handleSubmitSubject(event: FormEvent) {
        event.preventDefault();

        try {
            await createSubject(title, color);
            toast.success("Matéria criada!");
            setTitle("");
            setColor("#3b82f6");
            setIsCreateSubjectOpen(false)

            router.refresh();
        } catch (error) {
            toast.error("Erro ao criar matéria");
            console.error("Erro ao criar matéria", error)
        }
    }

    async function handleTopicStatusChange(topicId: string, newStatus: TopicStatus) {
        try {
            await updateTopicStatus(topicId, newStatus);
            toast.success("Status do tópico atualizado!");
            router.refresh();
        } catch (error) {
            toast.error("Falha ao atualizar o status.");
            console.error("Erro:", error);
        }
    }

    async function handleEditTopic(topicId: string, title: string, link: string, review1: string) {
        try {
            await updateTopic(topicId, title, link, review1);
            toast.success("Assunto editado!");
            router.refresh();
        } catch (error) {
            toast.error("Falha ao editar assunto!");
            console.error("Erro:", error);
        }
    }

    async function handleAttachPDF(topicId: string, file: File) {
        try {
            await sendAttachPDF(topicId, file);
            toast.success("Anexo enviado!");
            router.refresh();
        } catch (error) {
            toast.error("Falha ao enviar o anexo!");
            console.error("Erro:", error);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex items-center gap-3 justify-between">
                <p className="p-2 py-4 font-medium text-sm text-muted-foreground">Gerencie suas matérias e assuntos</p>
                <DialogDemo
                    contentBtn="Nova Matéria"
                    title="Nova Matéria"
                    description="Crie uma nova matéria para organizar seus estudos."
                    nameConfirmBtn="Criar Matéria"
                    onSubmit={handleSubmitSubject}
                    open={isCreateSubjectOpen}
                    onOpenChange={setIsCreateSubjectOpen}
                    classNameBtn="mr-2"
                >
                    <FieldGroup>
                        <Field>
                            <Label htmlFor="name-1">Nome:</Label>
                            <Input id="name-1" name="name" placeholder="Nome da matéria" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </Field>
                        <Field>
                            <Label htmlFor="description-1">Escolha uma cor:</Label>
                            <ColorPicker value={color} onChange={setColor} />
                        </Field>
                    </FieldGroup>
                </DialogDemo>
            </div>

            <div className="px-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {subjects.length > 0 ? (
                    subjects.map((subject) => (
                        <SubjectBox
                            key={subject.id}
                            subject={subject}
                            onStatusChange={handleTopicStatusChange}
                            onEditTopic={handleEditTopic}
                            onAttachPDF={handleAttachPDF}
                        />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground p-2 text-center">
                        Nenhuma matéria cadastrada.
                    </p>
                )}
            </div>
        </div>
    );
}

export function MateriasSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex items-center gap-3 justify-between">
                <p className="p-2 py-4 font-medium text-sm text-muted-foreground">Gerencie suas matérias e assuntos</p>
                <Button variant={"outline"} className={"mr-2"}>Nova Matéria</Button>
            </div>

            {/* Grid dos Cartões */}
            <div className="px-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SubjectBoxSkeleton />
                <SubjectBoxSkeleton />
                <SubjectBoxSkeleton />
                <SubjectBoxSkeleton />
            </div>
        </div>
    );
}
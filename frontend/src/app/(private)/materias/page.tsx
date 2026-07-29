"use client"

import { DialogDemo } from "@/components/dialog-button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { FormEvent, useEffect, useState } from "react";
import SubjectBox from "@/components/subject-box";
import { getTopics, updateTopic, updateTopicStatus } from "@/services/topics.service";
import { Subject } from "@/types/subject";
import { Topic, TopicStatus } from "@/types/topic";
import { createSubject, getSubjects } from "@/services/subjects.service";
import toast from "react-hot-toast";

export type TopicsBySubject = Record<
    string,
    {
        subject: Subject
        topics: Topic[]
    }
>

export default function MateriasPage() {
    const [color, setColor] = useState("#3b82f6")
    const [title, setTitle] = useState("")
    const [subjects, setSubjects] = useState<Subject[]>([])

    async function loadSubjects() {
        const [allSubjects, allTopics] = await Promise.all([
            getSubjects(),
            getTopics()
        ])

        const topicsMap = new Map<string, Topic[]>()
        allTopics.forEach((topic) => {
            const subjectId = topic.subject.id
            if (!topicsMap.has(subjectId)) {
                topicsMap.set(subjectId, [])
            }
            topicsMap.get(subjectId)?.push(topic)
        })

        const subjectsWithTopics = allSubjects.map((subject) => ({
            ...subject,
            topics: topicsMap.get(subject.id) ?? []
        }))

        setSubjects(subjectsWithTopics)
    }

    useEffect(() => {
        const fetchData = async () => {
            await loadSubjects();
        };

        void fetchData();
    }, [])

    async function handleSubmitSubject(event: FormEvent) {
        event.preventDefault()

        await createSubject(title, color)
        toast.success("Matéria criada!")
        setTitle("")
        setColor("#3b82f6")
        await loadSubjects()
    }

    async function handleTopicStatusChange(topicId: string, newStatus: TopicStatus) {
        try {
            await updateTopicStatus(topicId, newStatus);
            toast.success("Status do tópico atualizado!");
            await loadSubjects();
        } catch (error) {
            toast.error("Falha ao atualizar o status.");
            console.error("Erro ao mudar status do tópico:", error);
        }
    }

    async function handleEditTopic(topicId: string, title: string, link: string, review1: string) {
        try {
            await updateTopic(topicId, title, link, review1);
            toast.success("Assunto editado!");
            await loadSubjects();
        } catch (error) {
            toast.error("Falha ao editar assunto!");
            console.error("Erro ao editar assunto:", error);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <h1 className="px-2 py-4 text-xl font-bold shadow-sm bg-card">Matérias</h1>
            <div className="flex items-center gap-3 justify-between  ">
                <p className="p-2 py-4 pt-5 font-medium text-sm text-muted-foreground">Gerencie suas matérias e assuntos</p>
                <DialogDemo
                    contentBtn="Nova Matéria"
                    title="Nova Matéria"
                    description="Crie uma nova matéria para organizar seus estudos."
                    nameConfirmBtn="Criar Matéria"
                    onSubmit={handleSubmitSubject}
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
                {subjects.map((subject) => (
                    <SubjectBox
                        key={subject.id}
                        subject={subject}
                        onUpdate={loadSubjects}
                        onStatusChange={handleTopicStatusChange}
                        onEditTopic={handleEditTopic}
                    />
                ))}
            </div>
        </div>
    );
}
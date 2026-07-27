"use client"

import { DialogDemo } from "@/components/dialog-button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { FormEvent, useEffect, useState } from "react";
import SubjectBox from "@/components/subject-box";
import { getTopics } from "@/services/topics.service";
import { Topic } from "@/types/topic";
import { Subject } from "@/types/subject";
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

    return (
        <div className="flex flex-col min-h-screen">
            <h1 className="px-2 text-xl font-bold shadow-sm bg-card">Matérias</h1>
            <div className="flex items-center gap-3 justify-between p-2">
                <p className="font-medium">Gerencie suas matérias e assuntos</p>
                <DialogDemo
                    contentBtn="Nova Matéria"
                    title="Nova Matéria"
                    description="Crie uma nova matéria para organizar seus estudos."
                    nameConfirmBtn="Criar Matéria"
                    onSubmit={handleSubmitSubject}
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
            <div className="px-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
                {subjects.map((subject) => (
                    <SubjectBox key={subject.id} subject={subject} onUpdate={loadSubjects}/>
                ))}
            </div>
        </div>
    );
}
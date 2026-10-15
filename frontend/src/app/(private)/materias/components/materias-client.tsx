"use client"

import { createSubjectAction } from "@/actions/subjects.actions";
import SubjectBox, { SubjectBoxSkeleton } from "@/app/(private)/materias/components/subject-box";
import { DataTransfer } from "@/components/data-transfer";
import { DialogDemo } from "@/components/dialog-button";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

type SubjectWithTopics = Subject & { topics: Topic[] };

interface MateriasClientProps {
    subjects: SubjectWithTopics[];
}

export default function MateriasClient({ subjects }: MateriasClientProps) {
    const [color, setColor] = useState("#3b82f6");
    const [title, setTitle] = useState("");
    const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false)
    // Ids das matérias reduzidas. Vazio = todas expandidas (padrão).
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

    const toggleSubject = (subjectId: string) => {
        setCollapsedIds((current) => {
            const next = new Set(current);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    };

    const expandAll = () => setCollapsedIds(new Set());
    const collapseAll = () => setCollapsedIds(new Set(subjects.map((subject) => subject.id)));

    async function handleSubmitSubject(event: FormEvent) {
        event.preventDefault();

        try {
            toast.loading("Criando matéria...", { id: "create-subject" });
            const formData = new FormData();
            formData.append("title", title);
            formData.append("color", color)
            await createSubjectAction(formData);
            toast.success("Matéria criada!", { id: "create-subject" });
            setTitle("");
            setColor("#3b82f6");
            setIsCreateSubjectOpen(false)
        } catch (error) {
            toast.error("Erro ao criar matéria", { id: "create-subject" });
            console.error("Erro ao criar matéria", error)
        }
    }

    return (
        <div className="flex flex-col">
            <PageHeader
                title="Matérias"
                description="Gerencie suas matérias e assuntos."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={expandAll} title="Expandir todas as matérias" disabled={subjects.length === 0}>
                            <ChevronsUpDown size={15} /> <span className="max-sm:hidden">Expandir todas</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={collapseAll} title="Reduzir todas as matérias" disabled={subjects.length === 0}>
                            <ChevronsDownUp size={15} /> <span className="max-sm:hidden">Reduzir todas</span>
                        </Button>
                        <DataTransfer />
                        <DialogDemo
                            contentBtn={
                                <div className="flex items-center gap-1">
                                    <Plus className="h-4 w-4" />
                                    <span>Nova Matéria</span>
                                </div>}
                            title="Nova matéria"
                            description="Crie uma nova matéria para organizar seus estudos."
                            nameConfirmBtn="Criar matéria"
                            onSubmit={handleSubmitSubject}
                            open={isCreateSubjectOpen}
                            onOpenChange={setIsCreateSubjectOpen}
                            classNameBtn="h-8 rounded-lg px-3 text-[0.8rem]"
                        >
                            <FieldGroup>
                                <Field>
                                    <Label htmlFor="name-1">Nome</Label>
                                    <Input id="name-1" name="name" placeholder="Nome da matéria" value={title} onChange={(e) => setTitle(e.target.value)} />
                                </Field>
                                <Field>
                                    <Label htmlFor="description-1">Cor</Label>
                                    <ColorPicker value={color} onChange={setColor} />
                                </Field>
                            </FieldGroup>
                        </DialogDemo>
                    </>
                }
            />

            {subjects.length > 0 ? (
                <div className="grid grid-cols-1  gap-4 lg:grid-cols-2">
                    {subjects.map((subject) => (
                        <SubjectBox
                            key={subject.id}
                            subject={subject}
                            isExpanded={!collapsedIds.has(subject.id)}
                            onToggleExpanded={() => toggleSubject(subject.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass rounded-2xl px-6 py-12 text-center">
                    <p className="font-medium">Você ainda não tem matérias.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Use o botão Nova matéria para criar a primeira e começar a adicionar assuntos.
                    </p>
                </div>
            )}
        </div>
    );
}

export function MateriasSkeleton() {
    return (
        <div className="flex flex-col">
            <PageHeader
                title="Matérias"
                description="Gerencie suas matérias e assuntos."
                actions={<Button variant="outline" size="sm" disabled>Nova matéria</Button>}
            />

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                <SubjectBoxSkeleton />
                <SubjectBoxSkeleton />
                <SubjectBoxSkeleton />
                <SubjectBoxSkeleton />
            </div>
        </div>
    );
}

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
import { ChevronsDownUp, ChevronsUpDown, Plus, RotateCw } from "lucide-react";
import Link from "next/link";
import { getSubjectStats } from "@/lib/subject-stats";
import { NEW_ITEM_EVENT, type NewItemEventDetail } from "@/lib/shortcut-events";
import { describeFailure, toastError } from "@/lib/toast-feedback";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LayoutToggle } from "./layout-toggle";
import { MateriasLayout } from "./layout-cookie";
import SubjectLinkCard from "./subject-link-card";

type SubjectWithTopics = Subject & { topics: Topic[] };

interface MateriasClientProps {
    subjects: SubjectWithTopics[];
    initialLayout?: MateriasLayout;
}

/** Resumo geral das matérias ativas: quantas são, quanto já foi concluído e quantas revisões esperam. */
function MateriasSummary({ subjects }: { subjects: SubjectWithTopics[] }) {
    const active = subjects.filter((subject) => subject.active !== false);
    const inactiveCount = subjects.length - active.length;

    let total = 0;
    let done = 0;
    let dueReviews = 0;
    for (const subject of active) {
        const stats = getSubjectStats(subject.topics);
        total += stats.total;
        done += stats.done;
        dueReviews += stats.dueReviews;
    }
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return (
        <section aria-label="Resumo geral" className="glass mb-4 flex flex-col gap-3 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <p className="text-sm">
                    <span className="font-semibold">{active.length === 1 ? "1 matéria" : `${active.length} matérias`}</span>
                    <span className="text-muted-foreground">
                        {" · "}
                        <span className="font-medium text-foreground tabular-nums">{done}</span> de{" "}
                        <span className="tabular-nums">{total}</span> assuntos concluídos (
                        <span className="tabular-nums">{percent}%</span>)
                        {inactiveCount > 0 && ` · ${inactiveCount} desativada${inactiveCount > 1 ? "s" : ""}`}
                    </span>
                </p>

                {dueReviews > 0 && (
                    <Link
                        href="/revisoes"
                        className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium tabular-nums text-primary transition-colors hover:bg-primary/25 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                        <RotateCw size={12} aria-hidden="true" />
                        {dueReviews} {dueReviews === 1 ? "revisão" : "revisões"} para hoje
                    </Link>
                )}
            </div>

            {total > 0 && (
                <div
                    role="progressbar"
                    aria-label="Progresso geral"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={done}
                    aria-valuetext={`${done} de ${total} assuntos concluídos`}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
                >
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${percent}%` }} />
                </div>
            )}
        </section>
    );
}

export default function MateriasClient({ subjects, initialLayout = "detalhado" }: MateriasClientProps) {
    const [layout, setLayout] = useState<MateriasLayout>(initialLayout)
    const isCompact = layout === "compacto"
    const [color, setColor] = useState("#3b82f6");
    const [title, setTitle] = useState("");
    const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false)
    // Ids das matérias reduzidas. Vazio = todas expandidas (padrão).
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

    // Atalho "N": abre o diálogo de nova matéria.
    useEffect(() => {
        const onNewItem = (event: Event) => {
            const detail = (event as CustomEvent<NewItemEventDetail>).detail;
            if (detail) detail.handled = true;
            setIsCreateSubjectOpen(true);
        };

        window.addEventListener(NEW_ITEM_EVENT, onNewItem);
        return () => window.removeEventListener(NEW_ITEM_EVENT, onNewItem);
    }, []);

    const toggleSubject = (subjectId: string) => {
        setCollapsedIds((current) => {
            const next = new Set(current);
            if (next.has(subjectId)) next.delete(subjectId);
            else next.add(subjectId);
            return next;
        });
    };

    // Um botão só: reduz tudo quando todas estão abertas; senão, expande tudo.
    const allExpanded = collapsedIds.size === 0;
    const toggleAll = () => setCollapsedIds(allExpanded ? new Set(subjects.map((subject) => subject.id)) : new Set());

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
            toastError(describeFailure("Erro ao criar a matéria", error), { id: "create-subject" });
            console.error("Erro ao criar matéria", error)
        }
    }

    return (
        <div className="flex flex-col">
            <PageHeader
                title="Matérias"
                description="Cadastre matérias e organize os assuntos de cada uma. Concluir um assunto aqui ou no Quadro agenda as revisões."
                actions={
                    <>
                        <LayoutToggle value={layout} onChange={setLayout} />
                        {!isCompact && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleAll}
                                title={allExpanded ? "Reduzir todas as matérias" : "Expandir todas as matérias"}
                                disabled={subjects.length === 0}
                            >
                                {allExpanded ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
                                <span className="max-sm:hidden">{allExpanded ? "Reduzir todas" : "Expandir todas"}</span>
                            </Button>
                        )}
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

            {subjects.length > 0 && <MateriasSummary subjects={subjects} />}

            {subjects.length > 0 ? (
                isCompact ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((subject) => (
                            <SubjectLinkCard key={subject.id} subject={subject} />
                        ))}
                    </div>
                ) : (
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
                )
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
                description="Cadastre matérias e organize os assuntos de cada uma. Concluir um assunto aqui ou no Quadro agenda as revisões."
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

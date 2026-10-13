"use client"

import { createQuestionLogsAction, deleteQuestionLogAction } from "@/actions/questions.actions";
import { QuestionLogDialog } from "@/components/question-log-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QuestionEntryInput, QuestionStats } from "@/types/question";
import { ChevronDown, ChevronUp, ListChecks, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type DesempenhoClientProps = {
    stats: QuestionStats;
};

type Level = { label: string; text: string; bar: string };

// Faixas de desempenho. A cor sempre vem acompanhada do texto (Fraco/Regular/Forte).
function getLevel(percent: number): Level {
    if (percent < 60) return { label: "Fraco", text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
    if (percent < 80) return { label: "Regular", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
    return { label: "Forte", text: "text-primary dark:text-primary", bar: "bg-primary" };
}

const formatPercent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

// Mais fracos primeiro; quem ainda não tem questões vai para o fim.
const weakestFirst = <T extends { total: number; percent: number }>(a: T, b: T) => {
    if ((a.total === 0) !== (b.total === 0)) return a.total === 0 ? 1 : -1;
    return a.percent - b.percent;
};

function PercentBar({ percent, className }: { percent: number; className: string }) {
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="presentation">
            <div className={cn("h-full rounded-full transition-all", className)} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
    );
}

export function DesempenhoClient({ stats }: DesempenhoClientProps) {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const subjects = [...stats.subjects].sort(weakestFirst);
    const overallLevel = getLevel(stats.overall.percent);

    const groups = stats.subjects.map((subject) => ({
        id: subject.id,
        title: subject.title,
        color: subject.color,
        topics: subject.topics.map((topic) => ({ id: topic.id, title: topic.title })),
    }));

    const handleCreate = async (entries: QuestionEntryInput[]) => {
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Registrando questões...", { id: "question-log" });

        try {
            const result = await createQuestionLogsAction(entries);
            if (result.success) {
                toast.success(result.message, { id: "question-log" });
                setIsDialogOpen(false);
                router.refresh();
            } else {
                toast.error(result.message, { id: "question-log" });
            }
        } catch {
            toast.error("Erro ao registrar as questões.", { id: "question-log" });
        } finally {
            setIsBusy(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (isBusy) return;
        if (!window.confirm("Remover este registro de questões? O % de acerto será recalculado.")) return;

        setIsBusy(true);
        toast.loading("Removendo registro...", { id: "question-log" });

        try {
            const result = await deleteQuestionLogAction(id);
            if (result.success) {
                toast.success(result.message, { id: "question-log" });
                router.refresh();
            } else {
                toast.error(result.message, { id: "question-log" });
            }
        } catch {
            toast.error("Erro ao remover o registro.", { id: "question-log" });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <section className="space-y-3 p-2 pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    As questões são registradas ao concluir uma sessão do ciclo. Você também pode lançar por aqui.
                </p>
                <Button variant={"outline"} size="sm" onClick={() => setIsDialogOpen(true)} disabled={isBusy || stats.subjects.length === 0}>
                    <Plus className="h-4 w-4" /> Registrar questões
                </Button>
            </div>

            <Card className="introduction-card" style={{ animationDelay: `${1 * 150}ms` }}>
                <CardHeader>
                    <CardDescription>Desempenho geral</CardDescription>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        {stats.overall.total > 0 ? (
                            <>
                                <span className={overallLevel.text}>{formatPercent(stats.overall.percent)}</span>
                                <Badge variant="outline">{overallLevel.label}</Badge>
                            </>
                        ) : (
                            <span className="text-lg text-muted-foreground">Sem questões registradas</span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {stats.overall.total > 0 && <PercentBar percent={stats.overall.percent} className={overallLevel.bar} />}
                    <dl className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <dt className="text-muted-foreground">Feitas</dt>
                            <dd className="font-semibold">{stats.overall.total}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Acertos</dt>
                            <dd className="font-semibold">{stats.overall.correct}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Erros</dt>
                            <dd className="font-semibold">{stats.overall.wrong}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            <Card className="introduction-card" style={{ animationDelay: `${2 * 150}ms` }}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4" /> Por matéria
                    </CardTitle>
                    <CardDescription>Clique em uma matéria para ver o % de acerto de cada assunto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {subjects.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma matéria ativa.</p>
                    )}

                    {subjects.map((subject) => {
                        const level = getLevel(subject.percent);
                        const hasData = subject.total > 0;
                        const isOpen = !!expanded[subject.id];
                        const topics = [...subject.topics].sort(weakestFirst);

                        return (
                            <div key={subject.id} className="rounded-md border">
                                <button
                                    type="button"
                                    onClick={() => setExpanded((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                                    aria-expanded={isOpen}
                                    className="flex w-full cursor-pointer flex-col gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                                        <span className="flex-1 truncate font-medium">{subject.title}</span>
                                        {hasData ? (
                                            <>
                                                <Badge variant="outline" className="shrink-0">{level.label}</Badge>
                                                <span className={cn("w-14 shrink-0 text-right text-sm font-semibold tabular-nums", level.text)}>
                                                    {formatPercent(subject.percent)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="shrink-0 text-xs text-muted-foreground">Sem questões</span>
                                        )}
                                        {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                                    </span>
                                    {hasData && (
                                        <>
                                            <PercentBar percent={subject.percent} className={level.bar} />
                                            <span className="text-xs text-muted-foreground">
                                                {subject.correct} acertos de {subject.total} questões
                                            </span>
                                        </>
                                    )}
                                </button>

                                {isOpen && (
                                    <ul className="space-y-2 border-t px-3 py-2">
                                        {topics.length === 0 && (
                                            <li className="text-sm text-muted-foreground">Esta matéria ainda não tem assuntos.</li>
                                        )}
                                        {topics.map((topic) => {
                                            const topicLevel = getLevel(topic.percent);
                                            const topicHasData = topic.total > 0;
                                            return (
                                                <li key={topic.id} className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="flex-1 truncate">{topic.title}</span>
                                                        {topicHasData ? (
                                                            <>
                                                                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                                                    {topic.correct}/{topic.total}
                                                                </span>
                                                                <Badge variant="outline" className="shrink-0">{topicLevel.label}</Badge>
                                                                <span className={cn("w-14 shrink-0 text-right font-semibold tabular-nums", topicLevel.text)}>
                                                                    {formatPercent(topic.percent)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="shrink-0 text-xs text-muted-foreground">Sem questões</span>
                                                        )}
                                                    </div>
                                                    {topicHasData && <PercentBar percent={topic.percent} className={topicLevel.bar} />}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Card className="introduction-card" style={{ animationDelay: `${3 * 150}ms` }}>
                <CardHeader>
                    <CardTitle>Registros recentes</CardTitle>
                    <CardDescription>Lançou errado? Remova o registro e o % é recalculado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recent.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma questão registrada ainda.</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {stats.recent.map((log) => (
                                <li key={log.id} className="flex items-center gap-3 text-sm">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: log.subjectColor }} />
                                    <span className="min-w-0 flex-1 truncate">
                                        {log.topicTitle}
                                        <span className="text-muted-foreground"> · {log.subjectTitle}</span>
                                    </span>
                                    <span className="shrink-0 text-muted-foreground">{log.correct}/{log.total}</span>
                                    <span className={cn("w-12 shrink-0 text-right font-semibold tabular-nums", getLevel(log.percent).text)}>
                                        {formatPercent(log.percent)}
                                    </span>
                                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                        {new Date(log.answeredAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDelete(log.id)} disabled={isBusy} aria-label="Remover registro">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <QuestionLogDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                title="Registrar questões"
                description="Escolha o assunto e informe quantas questões você fez e quantas acertou."
                groups={groups}
                required
                submitLabel="Registrar"
                isBusy={isBusy}
                onSubmit={handleCreate}
            />
        </section>
    );
}

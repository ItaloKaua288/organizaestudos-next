"use client"

import { createQuestionLogsAction, deleteQuestionLogAction } from "@/actions/questions.actions";
import { QuestionLogDialog } from "@/components/question-log-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QuestionEntryInput, QuestionStats } from "@/types/question";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronDown, History, ListChecks, Minus, Plus, Trash2, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PercentBar } from "./percent-bar";
import {
    LEVEL_WEAK_BELOW,
    WEAK_LIMIT,
    WEAK_MIN_QUESTIONS,
    formatDateTime,
    formatDay,
    formatPercent,
    getLevel,
    weakestFirst,
} from "./performance-utils";
import { ScoreRing } from "./score-ring";
import { TrendChart } from "./trend-chart";

type DesempenhoClientProps = {
    stats: QuestionStats;
};

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
        </div>
    );
}

function Dot({ color }: { color: string }) {
    return <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

export function DesempenhoClient({ stats }: DesempenhoClientProps) {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const subjects = [...stats.subjects].sort(weakestFirst);
    const hasData = stats.overall.total > 0;

    const weakTopics = stats.subjects
        .flatMap((subject) =>
            subject.topics.map((topic) => ({ ...topic, subjectTitle: subject.title, subjectColor: subject.color }))
        )
        .filter((topic) => topic.total >= WEAK_MIN_QUESTIONS && topic.percent < LEVEL_WEAK_BELOW)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, WEAK_LIMIT);

    // Compara a última semana com questões com a anterior.
    const lastWeek = stats.trend[stats.trend.length - 1] ?? null;
    const previousWeek = stats.trend.length > 1 ? stats.trend[stats.trend.length - 2] : null;
    const delta = lastWeek && previousWeek ? Math.round((lastWeek.percent - previousWeek.percent) * 10) / 10 : null;

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
        <section className="space-y-4 p-2 pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    As questões são registradas ao concluir uma sessão do ciclo. Você também pode lançar por aqui.
                </p>
                <Button variant={"outline"} size="sm" onClick={() => setIsDialogOpen(true)} disabled={isBusy || stats.subjects.length === 0}>
                    <Plus className="h-4 w-4" /> Registrar questões
                </Button>
            </div>

            {/* Resumo geral */}
            <Card className="introduction-card" style={{ animationDelay: `${1 * 150}ms` }}>
                <CardContent className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
                    <div className="flex items-center gap-5">
                        <ScoreRing percent={stats.overall.percent} empty={!hasData} />
                        <div className="md:hidden">
                            <p className="text-sm font-medium">Desempenho geral</p>
                            {!hasData && <p className="text-sm text-muted-foreground">Sem questões registradas</p>}
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <p className="hidden text-sm font-medium md:block">
                            Desempenho geral
                            {!hasData && <span className="font-normal text-muted-foreground"> · sem questões registradas</span>}
                        </p>
                        <dl className="grid grid-cols-3 gap-2">
                            <Stat label="Feitas" value={stats.overall.total} />
                            <Stat label="Acertos" value={stats.overall.correct} />
                            <Stat label="Erros" value={stats.overall.wrong} />
                        </dl>
                    </div>

                    <div className="space-y-1 border-t pt-4 md:w-56 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                        <p className="text-xs text-muted-foreground">
                            {lastWeek ? `Semana de ${formatDay(lastWeek.weekStart)}` : "Última semana"}
                        </p>
                        {lastWeek ? (
                            <>
                                <p className={cn("text-2xl font-semibold tabular-nums", getLevel(lastWeek.percent).text)}>
                                    {formatPercent(lastWeek.percent)}
                                </p>
                                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                    {delta === null ? (
                                        <>{lastWeek.correct} de {lastWeek.total} questões</>
                                    ) : delta === 0 ? (
                                        <><Minus className="h-4 w-4" /> Igual à semana anterior</>
                                    ) : delta > 0 ? (
                                        <><ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {formatPercent(delta)} a mais que a anterior</>
                                    ) : (
                                        <><ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" /> {formatPercent(Math.abs(delta))} a menos que a anterior</>
                                    )}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Registre questões para acompanhar a semana.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                {/* Evolução */}
                <Card className="introduction-card lg:col-span-2 h-full" style={{ animationDelay: `${2 * 150}ms` }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Evolução do % de acerto
                        </CardTitle>
                        <CardDescription>
                            Acertos sobre questões feitas em cada semana (últimas 12). A linha tracejada marca {LEVEL_WEAK_BELOW}%.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.trend.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                Registre questões para ver sua evolução semana a semana.
                            </p>
                        ) : (
                            <TrendChart points={stats.trend} />
                        )}
                    </CardContent>
                </Card>

                {/* Pontos fracos */}
                <Card className="introduction-card h-full max-h-105 " style={{ animationDelay: `${2 * 150}ms` }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Pontos fracos
                            {weakTopics.length > 0 && <Badge variant="secondary">{weakTopics.length}</Badge>}
                        </CardTitle>
                        <CardDescription>
                            Menos de {LEVEL_WEAK_BELOW}% de acerto, com pelo menos {WEAK_MIN_QUESTIONS} questões feitas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-auto">
                        {weakTopics.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                {hasData ? "Nenhum assunto fraco por enquanto." : "Os assuntos fracos aparecem aqui depois de registrar questões."}
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {weakTopics.map((topic) => {
                                    const level = getLevel(topic.percent);
                                    return (
                                        <li key={topic.id} className="space-y-1.5">
                                            <div className="flex items-start gap-2">
                                                <span className="mt-1.5"><Dot color={topic.subjectColor} /></span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{topic.title}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {topic.subjectTitle} · {topic.correct} de {topic.total}
                                                    </p>
                                                </div>
                                                <span className={cn("shrink-0 text-sm font-semibold tabular-nums", level.text)}>
                                                    {formatPercent(topic.percent)}
                                                </span>
                                            </div>
                                            <PercentBar percent={topic.percent} className={level.bar} label={`Acerto em ${topic.title}`} />
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Por matéria */}
                <Card className="introduction-card lg:col-span-2" style={{ animationDelay: `${3 * 150}ms` }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4" /> Por matéria
                        </CardTitle>
                        <CardDescription>As mais fracas vêm primeiro. Clique em uma matéria para ver os assuntos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {subjects.length === 0 && (
                            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhuma matéria ativa.</p>
                        )}

                        {subjects.map((subject) => {
                            const level = getLevel(subject.percent);
                            const subjectHasData = subject.total > 0;
                            const isOpen = !!expanded[subject.id];
                            const topics = [...subject.topics].sort(weakestFirst);

                            return (
                                <div key={subject.id} className="overflow-hidden rounded-lg border">
                                    <button
                                        type="button"
                                        onClick={() => setExpanded((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                                        aria-expanded={isOpen}
                                        className="flex w-full cursor-pointer flex-col gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Dot color={subject.color} />
                                            <span className="min-w-0 flex-1 truncate font-medium">{subject.title}</span>
                                            {subjectHasData ? (
                                                <>
                                                    <Badge variant="outline" className="shrink-0">{level.label}</Badge>
                                                    <span className={cn("w-14 shrink-0 text-right text-base font-semibold tabular-nums", level.text)}>
                                                        {formatPercent(subject.percent)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="shrink-0 text-xs text-muted-foreground">Sem questões</span>
                                            )}
                                            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                                        </span>
                                        {subjectHasData && (
                                            <>
                                                <PercentBar percent={subject.percent} className={level.bar} label={`Acerto em ${subject.title}`} />
                                                <span className="text-xs text-muted-foreground">
                                                    {subject.correct} acertos de {subject.total} questões
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    {isOpen && (
                                        <ul className="space-y-3 border-t bg-muted/30 px-3 py-3">
                                            {topics.length === 0 && (
                                                <li className="text-sm text-muted-foreground">Esta matéria ainda não tem assuntos.</li>
                                            )}
                                            {topics.map((topic) => {
                                                const topicLevel = getLevel(topic.percent);
                                                const topicHasData = topic.total > 0;
                                                return (
                                                    <li key={topic.id} className="space-y-1.5 border-l-2 pl-3" style={{ borderColor: subject.color }}>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="min-w-0 flex-1 truncate">{topic.title}</span>
                                                            {topicHasData ? (
                                                                <>
                                                                    <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
                                                                        {topic.correct}/{topic.total}
                                                                    </span>
                                                                    <span className={cn("w-14 shrink-0 text-right font-semibold tabular-nums", topicLevel.text)}>
                                                                        {formatPercent(topic.percent)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="shrink-0 text-xs text-muted-foreground">Sem questões</span>
                                                            )}
                                                        </div>
                                                        {topicHasData && (
                                                            <PercentBar percent={topic.percent} className={topicLevel.bar} label={`Acerto em ${topic.title}`} />
                                                        )}
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

                {/* Registros recentes */}
                <Card className="introduction-card" style={{ animationDelay: `${3 * 150}ms` }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-4 w-4" /> Registros recentes
                        </CardTitle>
                        <CardDescription>Lançou errado? Remova o registro e o % é recalculado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.recent.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Nenhuma questão registrada ainda.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {stats.recent.map((log) => (
                                    <li key={log.id} className="flex items-center gap-2 py-2">
                                        <span className="mt-0.5 self-start"><Dot color={log.subjectColor} /></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{log.topicTitle}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {log.subjectTitle} · {formatDateTime(log.answeredAt)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className={cn("text-sm font-semibold tabular-nums", getLevel(log.percent).text)}>{formatPercent(log.percent)}</p>
                                            <p className="text-xs tabular-nums text-muted-foreground">{log.correct}/{log.total}</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDelete(log.id)} disabled={isBusy} aria-label={`Remover registro de ${log.topicTitle}`}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

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

"use client"

import { createQuestionLogsAction, deleteQuestionLogAction } from "@/actions/questions.actions";
import { QuestionLogDialog } from "@/components/question-log-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { describeFailure, toastError, toastUndo } from "@/lib/toast-feedback";
import { cn } from "@/lib/utils";
import { QuestionEntryInput, QuestionRecentLog, QuestionStats, QuestionSubjectStat } from "@/types/question";
import { formatRelativeTime } from "@/lib/relative-time";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronDown, ChevronsDownUp, ChevronsUpDown, Flame, History, ListChecks, Minus, Plus, Search, Target, Trash2, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PercentBar } from "./percent-bar";
import {
    TARGET_MAX,
    TARGET_MIN,
    TARGET_PRESETS,
    SMALL_SAMPLE_BELOW,
    STALE_AFTER_DAYS,
    SUBJECT_SORTS,
    WEAK_LIMIT,
    WEAK_MIN_QUESTIONS,
    formatDateTime,
    formatPercent,
    getLevel,
    daysSince,
    normalizeText,
    sortComparator,
    summarizeActivity,
    weakBelowOf,
    type SubjectSort,
} from "./performance-utils";
import { ScoreRing } from "./score-ring";
import { TargetProvider, useTargetStorage } from "./target";
import { TrendChart } from "./trend-chart";

type DesempenhoClientProps = {
    stats: QuestionStats;
};

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-heading text-2xl font-semibold tabular-nums">{value}</dd>
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
    const [defaultTopicId, setDefaultTopicId] = useState<string | undefined>(undefined);
    const [sort, setSort] = useState<SubjectSort>("weakest");
    const [query, setQuery] = useState("");
    const [target, setTarget] = useTargetStorage();
    const weakBelow = weakBelowOf(target);
    const [attentionTab, setAttentionTab] = useState<"weak" | "stale">("weak");

    const hasData = stats.overall.total > 0;
    const searching = normalizeText(query) !== "";

    // Busca por matéria ou assunto. Quando só o assunto bate, a matéria aparece com apenas os assuntos encontrados.
    const subjects = (() => {
        const needle = normalizeText(query);
        const compare = sortComparator(sort);

        return stats.subjects
            .map((subject) => {
                if (!needle || normalizeText(subject.title).includes(needle)) return subject;
                const topics = subject.topics.filter((topic) => normalizeText(topic.title).includes(needle));
                return topics.length > 0 ? { ...subject, topics } : null;
            })
            .filter((subject): subject is QuestionSubjectStat => subject !== null)
            .sort(compare);
    })();

    const allExpanded = subjects.length > 0 && subjects.every((subject) => searching || expanded[subject.id]);
    const toggleAll = () => setExpanded(Object.fromEntries(stats.subjects.map((subject) => [subject.id, !allExpanded])));

    const openDialog = (topicId?: string) => {
        setDefaultTopicId(topicId);
        setIsDialogOpen(true);
    };

    const allTopics = stats.subjects.flatMap((subject) =>
        subject.topics.map((topic) => ({ ...topic, subjectTitle: subject.title, subjectColor: subject.color }))
    );

    // Sempre mostra os assuntos com pior % (com amostra mínima), mesmo acima do corte de "Fraco".
    // Assim o card continua útil quando a média é alta e nada fica abaixo de 60%.
    const lowestTopics = allTopics
        .filter((topic) => topic.total >= WEAK_MIN_QUESTIONS)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, WEAK_LIMIT);
    const belowCutoff = lowestTopics.filter((topic) => topic.percent < weakBelow).length;

    // Assuntos já praticados, mas parados há muito tempo: os mais antigos primeiro.
    const staleTopics = allTopics
        .map((topic) => ({ ...topic, idleDays: daysSince(stats.today, topic.lastAnsweredAt) }))
        .filter((topic): topic is typeof topic & { idleDays: number } => topic.total > 0 && topic.idleDays !== null && topic.idleDays >= STALE_AFTER_DAYS)
        .sort((a, b) => b.idleDays - a.idleDays)
        .slice(0, WEAK_LIMIT);

    const attentionTopics = attentionTab === "weak" ? lowestTopics : staleTopics;

    // Semana calendário (segunda a hoje) contra a semana passada inteira. Antes comparava com a última
    // semana que tinha questões, o que podia ser de meses atrás e enganava o "a mais que a anterior".
    const activity = summarizeActivity(stats.today, stats.daily);
    const { thisWeek, previousWeek } = activity;
    const delta =
        thisWeek.percent !== null && previousWeek.percent !== null
            ? Math.round((thisWeek.percent - previousWeek.percent) * 10) / 10
            : null;

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
                toastError(describeFailure("Não foi possível registrar as questões", result.message), { id: "question-log" });
            }
        } catch (error) {
            toastError(describeFailure("Erro ao registrar as questões", error), {
                id: "question-log",
                retry: () => void handleCreate(entries),
            });
        } finally {
            setIsBusy(false);
        }
    };

    // Recria o registro removido, com a data original, para o "Desfazer" do toast.
    const restoreLog = async (log: QuestionRecentLog) => {
        toast.loading("Restaurando registro...", { id: "question-log" });

        try {
            const result = await createQuestionLogsAction([{ topic_id: log.topicId, total: log.total, correct: log.correct }], log.answeredAt);
            if (result.success) {
                toast.success("Registro restaurado.", { id: "question-log" });
                router.refresh();
            } else {
                toastError(describeFailure("Não foi possível restaurar o registro", result.message), {
                    id: "question-log",
                    retry: () => void restoreLog(log),
                });
            }
        } catch (error) {
            toastError(describeFailure("Erro ao restaurar o registro", error), {
                id: "question-log",
                retry: () => void restoreLog(log),
            });
        }
    };

    // Sem confirmação antes: remove na hora e oferece "Desfazer" no toast.
    const handleDelete = async (log: QuestionRecentLog) => {
        if (isBusy) return;

        setIsBusy(true);
        toast.loading("Removendo registro...", { id: "question-log" });

        try {
            const result = await deleteQuestionLogAction(log.id);
            if (result.success) {
                toastUndo("Registro removido. O % foi recalculado.", () => void restoreLog(log), { id: "question-log" });
                router.refresh();
            } else {
                toastError(describeFailure("Não foi possível remover o registro", result.message), { id: "question-log" });
            }
        } catch (error) {
            toastError(describeFailure("Erro ao remover o registro", error), {
                id: "question-log",
                retry: () => void handleDelete(log),
            });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <TargetProvider value={target}>
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    As questões são registradas ao concluir uma sessão do ciclo. Você também pode lançar por aqui.
                </p>
                <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger render={<Button variant="outline" size="sm" />}>
                        <Target className="h-4 w-4" /> Meta: {target}%
                    </PopoverTrigger>
                    <PopoverContent align="end">
                        <p className="font-medium">Meta de acerto</p>
                        <p className="text-xs text-muted-foreground">
                            {target}% ou mais é Forte. De {weakBelow}% até menos de {target}% é Regular. Abaixo de {weakBelow}% é Fraco. A meta fica salva neste navegador.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {TARGET_PRESETS.map((preset) => (
                                <Button key={preset} type="button" size="sm" variant={preset === target ? "default" : "outline"} onClick={() => setTarget(preset)}>
                                    {preset}%
                                </Button>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            Outra
                            <Input
                                type="number"
                                min={TARGET_MIN}
                                max={TARGET_MAX}
                                value={target}
                                onChange={(event) => {
                                    const next = Number(event.target.value);
                                    if (Number.isFinite(next) && next >= TARGET_MIN && next <= TARGET_MAX) setTarget(next);
                                }}
                                className="w-20"
                                aria-label="Meta de acerto em porcentagem"
                            />
                            %
                        </label>
                    </PopoverContent>
                </Popover>
                <Button variant={"outline"} size="sm" onClick={() => openDialog()} disabled={isBusy || stats.subjects.length === 0}>
                    <Plus className="h-4 w-4" /> Registrar questões
                </Button>
                </div>
            </div>

            {/* Resumo geral */}
            <Card>
                <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
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
                            {!hasData && <span className="font-normal text-muted-foreground"> (sem questões registradas)</span>}
                        </p>
                        <dl className="grid grid-cols-3 gap-4">
                            <Stat label="Feitas" value={stats.overall.total} />
                            <Stat label="Acertos" value={stats.overall.correct} />
                            <Stat label="Erros" value={stats.overall.wrong} />
                        </dl>
                    </div>

                    <div className="space-y-1 border-t border-border pt-4 md:w-56 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                        <p className="text-sm text-muted-foreground">Esta semana</p>
                        {thisWeek.percent !== null ? (
                            <>
                                <p className={cn("font-heading text-2xl font-semibold tabular-nums", getLevel(thisWeek.percent, target).text)}>
                                    {formatPercent(thisWeek.percent)}
                                </p>
                                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                    {delta === null ? (
                                        <>{thisWeek.correct} de {thisWeek.total} questões</>
                                    ) : delta === 0 ? (
                                        <><Minus className="h-4 w-4" /> Igual à semana passada</>
                                    ) : delta > 0 ? (
                                        <><ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {formatPercent(delta)} a mais que a semana passada</>
                                    ) : (
                                        <><ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" /> {formatPercent(Math.abs(delta))} a menos que a semana passada</>
                                    )}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {hasData ? "Nenhuma questão registrada nesta semana ainda." : "Registre questões para acompanhar a semana."}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {hasData && (
                <dl className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-card px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5" /> Hoje</dt>
                        <dd className="font-heading text-xl font-semibold tabular-nums">{activity.todayTotal}<span className="ml-1 text-xs font-normal text-muted-foreground">questões</span></dd>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Últimos 7 dias</dt>
                        <dd className="font-heading text-xl font-semibold tabular-nums">{activity.last7Total}<span className="ml-1 text-xs font-normal text-muted-foreground">questões</span></dd>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3">
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5" /> Sequência</dt>
                        <dd className="font-heading text-xl font-semibold tabular-nums">{activity.streak}<span className="ml-1 text-xs font-normal text-muted-foreground">{activity.streak === 1 ? "dia" : "dias"}</span></dd>
                    </div>
                </dl>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Evolução */}
                <Card className="lg:col-span-2 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" /> Evolução do % de acerto
                        </CardTitle>
                        <CardDescription>
                            Acertos sobre as questões feitas no período escolhido. A linha tracejada marca {weakBelow}%.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasData ? (
                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                                <p className="text-sm text-muted-foreground">Nada por aqui ainda. Registre questões para ver sua evolução.</p>
                                <Button variant="outline" size="sm" onClick={() => openDialog()} disabled={isBusy || stats.subjects.length === 0}>
                                    <Plus className="h-4 w-4" /> Registrar questões
                                </Button>
                            </div>
                        ) : (
                            <TrendChart today={stats.today} daily={stats.daily} hourly={stats.hourly} />
                        )}
                    </CardContent>
                </Card>

                {/* Pontos de atenção */}
                <Card className="max-h-105 lg:h-0 lg:max-h-none lg:min-h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Onde melhorar
                            {belowCutoff > 0 && attentionTab === "weak" && <Badge variant="secondary">{belowCutoff} fraco{belowCutoff === 1 ? "" : "s"}</Badge>}
                        </CardTitle>
                        <CardDescription>
                            {attentionTab === "weak"
                                ? belowCutoff > 0
                                    ? `Os menores % com pelo menos ${WEAK_MIN_QUESTIONS} questões. Abaixo de ${weakBelow}% é ponto fraco.`
                                    : `Nenhum assunto abaixo de ${weakBelow}%. Estes são os menores % com pelo menos ${WEAK_MIN_QUESTIONS} questões.`
                                : `Assuntos que você já praticou, mas sem questões há ${STALE_AFTER_DAYS} dias ou mais.`}
                        </CardDescription>
                        <div role="tablist" aria-label="Tipo de atenção" className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-border bg-foreground/4 p-1">
                            {([["weak", "Menor acerto", lowestTopics.length], ["stale", "Parados", staleTopics.length]] as const).map(([key, label, count]) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    aria-selected={attentionTab === key}
                                    onClick={() => setAttentionTab(key)}
                                    className={cn(
                                        "cursor-pointer rounded-lg px-2 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                                        attentionTab === key ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {label} <span className="tabular-nums">({count})</span>
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 overflow-auto">
                        {attentionTopics.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                {!hasData
                                    ? "Os assuntos de atenção aparecem aqui depois de registrar questões."
                                    : attentionTab === "weak"
                                        ? `Ainda não há assunto com ${WEAK_MIN_QUESTIONS} questões ou mais.`
                                        : `Nenhum assunto parado há ${STALE_AFTER_DAYS} dias ou mais. Bom ritmo!`}
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {attentionTopics.map((topic) => {
                                    const level = getLevel(topic.percent, target);
                                    const idleDays = "idleDays" in topic ? (topic.idleDays as number) : null;
                                    return (
                                        <li key={topic.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                                            <div className="flex items-start gap-2">
                                                <span className="mt-1.5"><Dot color={topic.subjectColor} /></span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{topic.title}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {topic.subjectTitle}, {topic.correct} de {topic.total}
                                                        {topic.lastAnsweredAt && <> · {idleDays !== null ? `última vez ${formatRelativeTime(topic.lastAnsweredAt)}` : formatRelativeTime(topic.lastAnsweredAt)}</>}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openDialog(topic.id)}
                                                    disabled={isBusy}
                                                    aria-label={`Registrar questões de ${topic.title}`}
                                                    title="Registrar questões deste assunto"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
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
                <Card className="lg:col-span-2 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-muted-foreground" /> Por matéria
                        </CardTitle>
                        <CardDescription>Clique em uma matéria para ver os assuntos.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-200 overflow-auto">
                        {stats.subjects.length > 0 && (
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <div className="relative min-w-40 flex-1">
                                    <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Buscar matéria ou assunto"
                                        aria-label="Buscar matéria ou assunto"
                                        className="pl-9"
                                    />
                                </div>
                                <select
                                    value={sort}
                                    onChange={(event) => setSort(event.target.value as SubjectSort)}
                                    aria-label="Ordenar matérias"
                                    className="h-9 rounded-xl border border-input bg-foreground/4 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
                                >
                                    {SUBJECT_SORTS.map((option) => (
                                        <option key={option.key} value={option.key}>{option.label}</option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" size="sm" onClick={toggleAll} disabled={searching || subjects.length === 0}>
                                    {allExpanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                                    {allExpanded ? "Recolher" : "Expandir"}
                                </Button>
                            </div>
                        )}

                        {stats.subjects.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Nenhuma matéria ativa. Crie uma matéria para acompanhar o desempenho.
                            </p>
                        )}

                        {stats.subjects.length > 0 && subjects.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">Nada encontrado para &quot;{query.trim()}&quot;.</p>
                        )}

                        <div className="divide-y divide-border">
                            {subjects.map((subject) => {
                                const level = getLevel(subject.percent, target);
                                const subjectHasData = subject.total > 0;
                                const isOpen = searching || !!expanded[subject.id];
                                const topics = [...subject.topics].sort(sortComparator(sort));

                                return (
                                    <div key={subject.id} className="py-1 first:pt-0 last:pb-0">
                                        <button
                                            type="button"
                                            onClick={() => setExpanded((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                                            aria-expanded={isOpen}
                                            className="flex w-full cursor-pointer flex-col gap-2 rounded-xl px-3 py-3 text-left transition-colors duration-150 hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Dot color={subject.color} />
                                                <span className="min-w-0 flex-1 truncate font-medium">{subject.title}</span>
                                                {subjectHasData ? (
                                                    <>
                                                        <Badge variant="outline" className="shrink-0">{level.label}</Badge>
                                                        <span className={cn("w-14 shrink-0 text-right font-heading text-base font-semibold tabular-nums", level.text)}>
                                                            {formatPercent(subject.percent)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="shrink-0 text-xs text-muted-foreground">Sem questões</span>
                                                )}
                                                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none", isOpen && "rotate-180")} />
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
                                            <ul className="space-y-3 px-3 pb-3 pt-1">
                                                {topics.length === 0 && (
                                                    <li className="text-sm text-muted-foreground">Esta matéria ainda não tem assuntos.</li>
                                                )}
                                                {topics.map((topic) => {
                                                    const topicLevel = getLevel(topic.percent, target);
                                                    const topicHasData = topic.total > 0;
                                                    return (
                                                        <li key={topic.id} className="space-y-1.5 border-l-2 pl-3" style={{ borderColor: subject.color }}>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="min-w-0 flex-1 truncate">{topic.title}</span>
                                                                {topicHasData && topic.total < SMALL_SAMPLE_BELOW && (
                                                                    <Badge variant="outline" className="shrink-0" title={`Menos de ${SMALL_SAMPLE_BELOW} questões: o % ainda oscila muito`}>
                                                                        Amostra pequena
                                                                    </Badge>
                                                                )}
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
                                                                <>
                                                                    <PercentBar percent={topic.percent} className={topicLevel.bar} label={`Acerto em ${topic.title}`} />
                                                                    {topic.lastAnsweredAt && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Última vez {formatRelativeTime(topic.lastAnsweredAt)} · {topic.sessions} {topic.sessions === 1 ? "registro" : "registros"}
                                                                        </p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Registros recentes */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" /> Registros recentes
                        </CardTitle>
                        <CardDescription>Lançou errado? Remova o registro e o % é recalculado. Dá para desfazer logo depois.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-200 overflow-auto">
                        {stats.recent.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Nenhuma questão registrada ainda. Use o botão Registrar questões para começar.
                            </p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {stats.recent.map((log) => (
                                    <li key={log.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                                        <span className="mt-0.5 self-start"><Dot color={log.subjectColor} /></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{log.topicTitle}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {log.subjectTitle}, {formatDateTime(log.answeredAt)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className={cn("text-sm font-semibold tabular-nums", getLevel(log.percent, target).text)}>{formatPercent(log.percent)}</p>
                                            <p className="text-xs tabular-nums text-muted-foreground">{log.correct}/{log.total}</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleDelete(log)} disabled={isBusy} aria-label={`Remover registro de ${log.topicTitle}`}>
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
                defaultTopicId={defaultTopicId}
                required
                submitLabel="Registrar"
                isBusy={isBusy}
                onSubmit={handleCreate}
            />
        </section>
        </TargetProvider>
    );
}

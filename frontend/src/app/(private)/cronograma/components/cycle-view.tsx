"use client"

import {
    cancelCycleSessionAction,
    completeCycleSessionAction,
    deleteCycleAction,
    restartCycleLapAction,
    saveCycleAction,
    skipCycleSessionAction,
    startCycleSessionAction,
} from "@/actions/cycle.actions";
import { QuestionLogDialog } from "@/components/question-log-dialog";
import { TopicSheetTrigger } from "@/components/topic-sheet-trigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Cycle, CycleActionResult, CycleSession } from "@/types/cycle";
import { QuestionEntryInput, QuestionTopicOption } from "@/types/question";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { DndContext } from "@dnd-kit/core";
import { BookOpen, Check, ChevronDown, ChevronUp, History, Pencil, Play, Plus, RotateCcw, RotateCw, SkipForward, Trash2, X } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CycleDragGhost } from "./cycle-drag-ghost";
import { CycleEditor } from "./cycle-editor";
import { CycleSessionRow } from "./cycle-session-row";
import { formatMinutes, TodayReview } from "./cycle-utils";
import { TopicDetailDialog } from "./topic-detail-dialog";
import { useCycleReorder } from "./use-cycle-reorder";

type CycleViewProps = {
    initialCycle: Cycle | null;
    subjects: Subject[];
    /** Primeiro assunto pendente de cada matéria (chave = id da matéria). */
    pendingTopicsBySubject: Record<string, Topic>;
    /** Todos os assuntos de cada matéria (chave = id da matéria), usados no registro de questões. */
    topicsBySubject: Record<string, QuestionTopicOption[]>;
    /** Revisões que vencem hoje. */
    todayReviews: TodayReview[];
};

const UPCOMING_LIMIT = 4;

export function CycleView({ initialCycle, subjects, pendingTopicsBySubject, topicsBySubject, todayReviews }: CycleViewProps) {
    const [cycle, setCycle] = useState<Cycle | null>(initialCycle);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [showUpcoming, setShowUpcoming] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
    const [detailSubject, setDetailSubject] = useState<CycleSession["subject"] | null>(null);
    // Trava síncrona: setState é assíncrono, então dois cliques rápidos passariam sem isto.
    const lockRef = useRef(false);

    const run = async (action: () => Promise<CycleActionResult>, loadingMessage: string, onDone?: () => void): Promise<CycleActionResult | null> => {
        if (lockRef.current) return null;
        lockRef.current = true;
        setIsBusy(true);
        const toastId = "cycle-action";
        toast.loading(loadingMessage, { id: toastId });

        try {
            const result = await action();
            if (result.cycle !== undefined) setCycle(result.cycle);

            if (result.success) {
                toast.success(result.message, { id: toastId });
                onDone?.();
            } else if (result.stale) {
                toast(result.message, { id: toastId, icon: "ℹ️" });
            } else {
                toast.error(result.message, { id: toastId });
            }

            return result;
        } catch {
            toast.error("Erro ao atualizar o ciclo.", { id: toastId });
            return null;
        } finally {
            lockRef.current = false;
            setIsBusy(false);
        }
    };

    // Arrastar para reordenar: atualiza a tela na hora e salva a nova ordem; se falhar, volta a ordem anterior.
    const handleReorder = async (from: number, to: number) => {
        if (!cycle || lockRef.current || from === to) return;
        lockRef.current = true;
        setIsBusy(true);

        const previous = cycle;
        const next = [...cycle.sessions];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setCycle({ ...cycle, sessions: next });

        try {
            const result = await saveCycleAction(next.map((s) => ({ id: s.id, subject_id: s.subject.id, duration: s.duration })));
            if (result.cycle) setCycle(result.cycle);
            if (result.success) {
                toast.success("Ordem do ciclo atualizada!", { id: "reorder-cycle" });
            } else {
                if (!result.cycle) setCycle(previous);
                toast.error(result.message, { id: "reorder-cycle" });
            }
        } catch {
            setCycle(previous);
            toast.error("Falha ao reordenar o ciclo.", { id: "reorder-cycle" });
        } finally {
            lockRef.current = false;
            setIsBusy(false);
        }
    };

    const { activeSession, dndProps } = useCycleReorder(cycle?.sessions ?? [], handleReorder);

    const reviewsSection = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-muted-foreground" /> Revisões de hoje
                    <Badge variant="secondary">{todayReviews.length}</Badge>
                </CardTitle>
                <CardDescription>Assuntos para revisar hoje, incluindo os atrasados.</CardDescription>
            </CardHeader>
            <CardContent>
                {todayReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma revisão para hoje nem atrasada. Volte amanhã ou continue o ciclo.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                        {todayReviews.map(({ topic, number, overdueDays }) => (
                            <TopicSheetTrigger
                                key={topic.id}
                                topic={topic}
                                className="flex h-auto w-full justify-start truncate rounded-xl border-transparent bg-transparent px-3 py-2 shadow-none hover:bg-foreground/6"
                            >
                                <span className="flex w-full items-center gap-2 truncate text-sm">
                                    <BookOpen className="h-3.5 w-3.5 shrink-0" color={topic.subject.color} />
                                    <span className="truncate">{topic.title}</span>
                                    {overdueDays > 0 && <Badge variant="destructive" className="ml-auto shrink-0">Atrasada {overdueDays}d</Badge>}
                                    <Badge variant="outline" className={overdueDays > 0 ? "shrink-0" : "ml-auto shrink-0"}>{number}ª revisão</Badge>
                                </span>
                            </TopicSheetTrigger>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (!cycle) {
        return (
            <section className="flex flex-col gap-4">
                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>Ciclo de estudos</CardTitle>
                        <CardDescription>
                            Monte uma sequência de matérias com a duração de cada sessão. O ciclo avança conforme você conclui
                            as sessões, sem depender de dias fixos: se você parar, continua exatamente de onde parou.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setIsEditorOpen(true)} disabled={subjects.length === 0}>
                            <Plus className="h-4 w-4" /> Criar ciclo
                        </Button>
                        {subjects.length === 0 && (
                            <p className="mt-2 text-sm text-muted-foreground">Cadastre ao menos uma matéria ativa para criar o ciclo.</p>
                        )}
                    </CardContent>
                </Card>
                {reviewsSection}
                <CycleEditor open={isEditorOpen} onOpenChange={setIsEditorOpen} cycle={null} subjects={subjects} onSaved={setCycle} />
            </section>
        );
    }

    const countedSessions = cycle.sessions.filter((s) => !s.inactive);
    const current = cycle.sessions.find((s) => s.id === cycle.currentSessionId) ?? null;
    const currentIndex = current ? countedSessions.findIndex((s) => s.id === current.id) : -1;

    // Próximas sessões em ordem circular a partir da atual; as que cruzam o fim já pertencem à próxima volta.
    const upcoming = current
        ? countedSessions
            .map((session, index) => {
                const offset = (index - currentIndex + countedSessions.length) % countedSessions.length;
                const open = session.status === "PENDENTE" || session.status === "EM_ANDAMENTO";
                return { session, offset, open, nextLap: index < currentIndex };
            })
            .filter(({ offset, open, nextLap }) => offset > 0 && (open || nextLap))
            .sort((a, b) => a.offset - b.offset)
            .slice(0, UPCOMING_LIMIT)
        : [];

    const totalMinutes = countedSessions.reduce((sum, s) => sum + s.duration, 0);
    const { completed, skipped, total, percent } = cycle.progress;
    const inactiveCount = cycle.sessions.length - countedSessions.length;

    const currentTopic = current ? pendingTopicsBySubject[current.subject.id] : undefined;

    // Conclui a sessão atual; com `questions`, também grava as questões feitas por assunto.
    const completeCurrent = async (questions?: QuestionEntryInput[]) => {
        if (!current) return;
        const result = await run(() => completeCycleSessionAction(current.id, cycle.lap, questions), "Concluindo sessão...");
        // Mantém o diálogo aberto só quando houve erro de validação, para o estudante corrigir os números.
        if (result && (result.success || result.stale)) setIsQuestionsOpen(false);
    };

    const confirmAndRun = (message: string, action: () => Promise<CycleActionResult>, loading: string) => {
        if (window.confirm(message)) void run(action, loading);
    };

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)} disabled={isBusy}>
                    <Pencil className="h-4 w-4" /> Editar ciclo
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => confirmAndRun(
                        "Reiniciar a volta atual? O progresso desta volta volta para zero e você recomeça na primeira sessão. O histórico é mantido.",
                        () => restartCycleLapAction(),
                        "Reiniciando volta..."
                    )}
                >
                    <RotateCcw className="h-4 w-4" /> Reiniciar volta
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => confirmAndRun(
                        "Excluir o ciclo de estudos e todo o seu histórico? Essa ação não pode ser desfeita.",
                        () => deleteCycleAction(),
                        "Excluindo ciclo..."
                    )}
                >
                    <Trash2 className="h-4 w-4 text-destructive" /> Excluir ciclo
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardDescription className="flex items-center gap-2">
                            <span>{current?.status === "EM_ANDAMENTO" ? "Estudando agora" : "Próxima matéria a estudar"}</span>
                            <Badge variant="secondary">Volta {cycle.lap}</Badge>
                        </CardDescription>
                        {current ? (
                            <CardTitle className="text-2xl">
                                <button
                                    type="button"
                                    onClick={() => setDetailSubject(current.subject)}
                                    title="Ver assunto a ser estudado"
                                    className="flex max-w-full cursor-pointer items-center gap-2 rounded-lg text-left transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                >
                                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: current.subject.color }} />
                                    <span className="truncate">{current.subject.title}</span>
                                </button>
                            </CardTitle>
                        ) : (
                            <CardTitle className="text-lg">Nenhuma sessão disponível</CardTitle>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {current ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Duração planejada de <span className="font-medium text-foreground">{formatMinutes(current.duration)}</span>, sessão {currentIndex + 1} de {countedSessions.length}.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setDetailSubject(current.subject)}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/8 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                >
                                    <BookOpen className="h-4 w-4 shrink-0" style={{ color: current.subject.color }} />
                                    <span className="truncate">
                                        {currentTopic
                                            ? <>Assunto: <span className="font-medium">{currentTopic.title}</span></>
                                            : <span className="text-muted-foreground">Sem assunto pendente nesta matéria</span>}
                                    </span>
                                </button>

                                <div className="flex flex-wrap gap-2">
                                    {current.status === "PENDENTE" && (
                                        <Button variant="outline" disabled={isBusy} onClick={() => run(() => startCycleSessionAction(current.id, cycle.lap), "Iniciando sessão...")}>
                                            <Play className="h-4 w-4" /> Iniciar
                                        </Button>
                                    )}
                                    <Button disabled={isBusy} onClick={() => setIsQuestionsOpen(true)}>
                                        <Check className="h-4 w-4" /> Concluir sessão
                                    </Button>
                                    {current.status === "EM_ANDAMENTO" && (
                                        <Button variant="outline" disabled={isBusy} onClick={() => run(() => cancelCycleSessionAction(current.id, cycle.lap), "Cancelando sessão...")}>
                                            <X className="h-4 w-4" /> Cancelar
                                        </Button>
                                    )}
                                    <Button variant="ghost" disabled={isBusy} onClick={() => run(() => skipCycleSessionAction(current.id, cycle.lap), "Pulando sessão...")}>
                                        <SkipForward className="h-4 w-4" /> Pular
                                    </Button>
                                </div>

                                <div>
                                    <Button variant="link" size="sm" className="px-0" onClick={() => setShowUpcoming((v) => !v)}>
                                        {showUpcoming ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        {showUpcoming ? "Ocultar próximas sessões" : "Ver próximas sessões"}
                                    </Button>
                                    {showUpcoming && (
                                        <ol className="mt-1 space-y-0.5">
                                            {upcoming.length === 0 && (
                                                <li className="text-sm text-muted-foreground">Não há outras sessões no ciclo.</li>
                                            )}
                                            {upcoming.map(({ session, nextLap }) => (
                                                <li key={session.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: session.subject.color }} />
                                                    <button type="button" onClick={() => setDetailSubject(session.subject)} className="cursor-pointer truncate rounded-md text-left transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
                                                        {session.subject.title}
                                                    </button>
                                                    <span className="tabular-nums text-muted-foreground">{formatMinutes(session.duration)}</span>
                                                    {nextLap && <Badge variant="outline">Volta {cycle.lap + 1}</Badge>}
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Todas as matérias do ciclo estão desativadas. Reative uma matéria ou edite o ciclo.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardDescription>Progresso da volta {cycle.lap}</CardDescription>
                        <CardTitle className="font-heading text-3xl tabular-nums">{percent}%</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Progress value={percent} aria-label={`Volta ${cycle.lap}: ${percent}% concluída`} />
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Nesta volta</dt>
                                <dd className="font-medium tabular-nums">{completed} de {total} concluídas</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Total concluídas</dt>
                                <dd className="font-medium tabular-nums">{cycle.totalCompleted}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Duração da volta</dt>
                                <dd className="font-medium tabular-nums">{formatMinutes(totalMinutes)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Puladas na volta</dt>
                                <dd className="font-medium tabular-nums">{skipped}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sessões do ciclo</CardTitle>
                    <CardDescription>A ordem abaixo é a ordem do ciclo. Segure a alça e arraste para reordenar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <DndContext {...dndProps}>
                        <ol className="space-y-0.5">
                            {cycle.sessions.map((session, index) => {
                                // Com "matérias por dia" > 0, cada grupo ganha um título e uma linha separadora.
                                const perDay = cycle.sessionsPerDay;
                                const startsDay = perDay > 0 && index % perDay === 0;
                                return (
                                    <Fragment key={session.id}>
                                        {startsDay && (
                                            <li
                                                role="presentation"
                                                className={cn("flex items-center gap-2 px-3 pb-1 pt-2 text-sm font-medium text-muted-foreground", index > 0 && "mt-2 border-t border-border pt-4")}
                                            >
                                                Dia {index / perDay + 1}
                                            </li>
                                        )}
                                        <CycleSessionRow
                                            session={session}
                                            index={index}
                                            isCurrent={session.id === cycle.currentSessionId}
                                            isBusy={isBusy}
                                            onOpenDetail={setDetailSubject}
                                        />
                                    </Fragment>
                                );
                            })}
                        </ol>
                        <CycleDragGhost session={activeSession} />
                    </DndContext>

                    <p className="flex items-center gap-2 px-3 pt-3 text-xs text-muted-foreground">
                        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                        Depois da última sessão, o ciclo recomeça na primeira (volta {cycle.lap + 1}).
                        {inactiveCount > 0 && ` ${inactiveCount} sessão(ões) de matérias desativadas são ignoradas.`}
                    </p>
                </CardContent>
            </Card>

            {reviewsSection}

            <Card>
                <CardHeader>
                    <Button variant="ghost" className="-ml-2 w-fit" onClick={() => setShowHistory((v) => !v)}>
                        <History className="h-4 w-4" />
                        <span className="font-medium">Histórico recente</span>
                        {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                {showHistory && (
                    <CardContent>
                        {cycle.history.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhuma sessão finalizada ainda. Conclua ou pule uma sessão para ela aparecer aqui.</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {cycle.history.map((item) => (
                                    <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.subjectColor }} />
                                        <span className="flex-1 truncate">{item.subjectTitle || "Matéria removida"}</span>
                                        <span className="shrink-0 tabular-nums text-muted-foreground">{formatMinutes(item.duration)}</span>
                                        <Badge variant={item.status === "CONCLUIDA" ? "secondary" : "outline"}>
                                            {item.status === "CONCLUIDA" ? "Concluída" : "Pulada"}, volta {item.lap}
                                        </Badge>
                                        <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                                            {new Date(item.finishedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                )}
            </Card>

            {current && (
                <QuestionLogDialog
                    open={isQuestionsOpen}
                    onOpenChange={setIsQuestionsOpen}
                    title="Concluir sessão"
                    description={`Quantas questões você fez e acertou em ${current.subject.title}? Isso gera seu % de acerto por assunto e por matéria. Se não fez questões, conclua sem registrar.`}
                    groups={[{ id: current.subject.id, title: current.subject.title, color: current.subject.color, topics: topicsBySubject[current.subject.id] ?? [] }]}
                    defaultTopicId={currentTopic?.id}
                    submitLabel="Concluir e registrar"
                    skipLabel="Concluir sem questões"
                    isBusy={isBusy}
                    onSubmit={(entries) => completeCurrent(entries)}
                    onSkip={() => completeCurrent()}
                />
            )}

            <TopicDetailDialog
                open={detailSubject !== null}
                onOpenChange={(open) => { if (!open) setDetailSubject(null); }}
                subject={detailSubject}
                topic={detailSubject ? pendingTopicsBySubject[detailSubject.id] : undefined}
            />

            <CycleEditor open={isEditorOpen} onOpenChange={setIsEditorOpen} cycle={cycle} subjects={subjects} onSaved={setCycle} />
        </section>
    );
}

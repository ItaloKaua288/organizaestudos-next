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
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Cycle, CycleActionResult, CycleSession } from "@/types/cycle";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { BookOpen, Check, ChevronDown, ChevronUp, GripVertical, History, Pencil, Play, Plus, RotateCcw, RotateCw, SkipForward, Trash2, X } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CycleDragGhost } from "./cycle-drag-ghost";
import { CycleEditor } from "./cycle-editor";
import { formatMinutes, TodayReview } from "./cycle-utils";
import { TopicDetailDialog } from "./topic-detail-dialog";
import { useCycleReorder } from "./use-cycle-reorder";

type CycleViewProps = {
    initialCycle: Cycle | null;
    subjects: Subject[];
    /** Primeiro assunto pendente de cada matéria (chave = id da matéria). */
    pendingTopicsBySubject: Record<string, Topic>;
    /** Revisões que vencem hoje. */
    todayReviews: TodayReview[];
};

const STATUS_LABEL: Record<CycleSession["status"], string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    PULADA: "Pulada",
};

const UPCOMING_LIMIT = 4;

export function CycleView({ initialCycle, subjects, pendingTopicsBySubject, todayReviews }: CycleViewProps) {
    const [cycle, setCycle] = useState<Cycle | null>(initialCycle);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [showUpcoming, setShowUpcoming] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [detailSubject, setDetailSubject] = useState<CycleSession["subject"] | null>(null);
    // Trava síncrona: setState é assíncrono, então dois cliques rápidos passariam sem isto.
    const lockRef = useRef(false);

    const run = async (action: () => Promise<CycleActionResult>, loadingMessage: string, onDone?: () => void) => {
        if (lockRef.current) return;
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
        } catch {
            toast.error("Erro ao atualizar o ciclo.", { id: toastId });
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

    const { draggedId, overId, ghost, ghostRef, getDragProps } = useCycleReorder(cycle?.sessions ?? [], handleReorder, isBusy);

    const reviewsSection = (
        <Card className="introduction-card" style={{ animationDelay: `${4 * 150}ms` }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4" /> Revisões de hoje
                    <Badge variant="secondary">{todayReviews.length}</Badge>
                </CardTitle>
                <CardDescription>Assuntos já estudados que precisam ser revisados hoje.</CardDescription>
            </CardHeader>
            <CardContent>
                {todayReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma revisão para hoje.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {todayReviews.map(({ topic, number }) => (
                            <DialogDemo
                                key={topic.id}
                                title={topic.title}
                                description="Detalhes do assunto da revisão"
                                contentBtn={
                                    <span className="flex w-full items-center gap-2 truncate text-sm">
                                        <BookOpen className="h-3.5 w-3.5 shrink-0" color={topic.subject.color} />
                                        <span className="truncate">{topic.title}</span>
                                        <Badge variant="outline" className="ml-auto shrink-0">{number}ª revisão</Badge>
                                    </span>
                                }
                                classNameBtn="w-full h-auto py-2 truncate flex justify-start rounded-sm dark:bg-card bg-card"
                                disableBtns={true}
                            >
                                <TopicInfoGroup subject={topic.subject.title} topic={topic} color={topic.subject.color} hasAttachments={topic.attachments && topic.attachments.length > 0} />
                            </DialogDemo>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (!cycle) {
        return (
            <section className="p-2 pt-0 space-y-3">
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

    const confirmAndRun = (message: string, action: () => Promise<CycleActionResult>, loading: string) => {
        if (window.confirm(message)) void run(action, loading);
    };

    return (
        <section className="p-2 pt-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 introduction-card"
                style={{ animationDelay: `${1 * 150}ms` }} >
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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <Card
                    className="lg:col-span-3 introduction-card"
                    style={{ animationDelay: `${1 * 150}ms` }}>
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
                                    className="flex max-w-full items-center gap-2 text-left cursor-pointer hover:text-primary transition-colors"
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
                                    Duração planejada: <span className="font-semibold text-foreground">{formatMinutes(current.duration)}</span>
                                    {" · "}Sessão {currentIndex + 1} de {countedSessions.length}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setDetailSubject(current.subject)}
                                    className="flex w-full items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-left text-sm cursor-pointer hover:bg-muted transition-colors"
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
                                    <Button disabled={isBusy} onClick={() => run(() => completeCycleSessionAction(current.id, cycle.lap), "Concluindo sessão...")}>
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
                                        <ol className="mt-1 space-y-1">
                                            {upcoming.length === 0 && (
                                                <li className="text-sm text-muted-foreground">Não há outras sessões no ciclo.</li>
                                            )}
                                            {upcoming.map(({ session, nextLap }) => (
                                                <li key={session.id} className="flex items-center gap-2 text-sm">
                                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: session.subject.color }} />
                                                    <button type="button" onClick={() => setDetailSubject(session.subject)} className="truncate text-left cursor-pointer hover:text-primary transition-colors">
                                                        {session.subject.title}
                                                    </button>
                                                    <span className="text-muted-foreground">{formatMinutes(session.duration)}</span>
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

                <Card className="lg:col-span-2 introduction-card"
                    style={{ animationDelay: `${2 * 150}ms` }} >
                    <CardHeader>
                        <CardDescription>Progresso da volta {cycle.lap}</CardDescription>
                        <CardTitle className="text-2xl">{percent}%</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Progress value={percent} aria-label={`Volta ${cycle.lap}: ${percent}% concluída`} />
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Nesta volta</dt>
                                <dd className="font-semibold">{completed} de {total} concluídas</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Total concluídas</dt>
                                <dd className="font-semibold">{cycle.totalCompleted}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Duração da volta</dt>
                                <dd className="font-semibold">{formatMinutes(totalMinutes)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Puladas na volta</dt>
                                <dd className="font-semibold">{skipped}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>

            <Card className="introduction-card" style={{ animationDelay: `${3 * 150}ms` }} >

                <CardHeader>
                    <CardTitle>Sessões do ciclo</CardTitle>
                    <CardDescription>A ordem abaixo é a ordem oficial do ciclo. Segure e arraste para reordenar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <ol className="space-y-1.5">
                        {cycle.sessions.map((session, index) => {
                            // Com "matérias por dia" > 0, cada grupo ganha um título e uma linha separadora.
                            const perDay = cycle.sessionsPerDay;
                            const startsDay = perDay > 0 && index % perDay === 0;
                            const isCurrent = session.id === cycle.currentSessionId;
                            const dragProps = getDragProps(session.id);
                            return (
                                <Fragment key={session.id}>
                                    {startsDay && (
                                        <li
                                            role="presentation"
                                            className={cn("flex items-center gap-2 pb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground", index > 0 && "border-t border-dashed pt-3 mt-2")}
                                        >
                                            Meta {index / perDay + 1}
                                        </li>
                                    )}
                                    <li
                                        {...dragProps.rowProps}
                                        aria-current={isCurrent ? "step" : undefined}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-opacity",
                                            isCurrent && "border-primary/50 bg-primary/5",
                                            session.inactive && "opacity-50",
                                            draggedId === session.id && "opacity-40",
                                            overId === session.id && draggedId !== session.id && "ring-2 ring-primary"
                                        )}
                                    >
                                        <span
                                            {...dragProps.handleProps}
                                            title="Segure e arraste para mudar a ordem"
                                            aria-label="Arrastar para reordenar"
                                            className={cn(
                                                "flex shrink-0 touch-none select-none items-center text-muted-foreground transition-colors hover:text-primary",
                                                isBusy ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
                                            )}
                                        >
                                            <GripVertical size={16} />
                                        </span>
                                        <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{index + 1}</span>
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: session.subject.color }} />
                                        <button
                                            type="button"
                                            disabled={session.inactive}
                                            onClick={() => setDetailSubject(session.subject)}
                                            title="Ver assunto a ser estudado"
                                            className={cn(
                                                "flex-1 truncate text-left font-medium enabled:cursor-pointer enabled:hover:text-primary transition-colors",
                                                session.status === "CONCLUIDA" && "line-through text-muted-foreground"
                                            )}
                                        >
                                            {session.subject.title}
                                        </button>
                                        <span className="text-muted-foreground shrink-0">{formatMinutes(session.duration)}</span>
                                        {session.inactive ? (
                                            <Badge variant="outline">{session.removed ? "Removida" : "Desativada"}</Badge>
                                        ) : isCurrent ? (
                                            <Badge>{session.status === "EM_ANDAMENTO" ? "Em andamento" : "Atual"}</Badge>
                                        ) : (
                                            <Badge variant={session.status === "CONCLUIDA" ? "secondary" : "outline"}>
                                                {STATUS_LABEL[session.status]}
                                            </Badge>
                                        )}
                                    </li>
                                </Fragment>
                            );
                        })}
                    </ol>

                    <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                        Depois da última sessão, o ciclo recomeça na primeira (volta {cycle.lap + 1}).
                        {inactiveCount > 0 && ` ${inactiveCount} sessão(ões) de matérias desativadas são ignoradas.`}
                    </p>
                </CardContent>
            </Card>

            {reviewsSection}

            <Card className="introduction-card" style={{ animationDelay: `${5 * 150}ms` }}>
                <CardHeader>
                    <Button variant="ghost" className="w-fit px-0 hover:bg-transparent" onClick={() => setShowHistory((v) => !v)}>
                        <History className="h-4 w-4" />
                        <span className="font-semibold">Histórico recente</span>
                        {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                {showHistory && (
                    <CardContent>
                        {cycle.history.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhuma sessão finalizada ainda.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {cycle.history.map((item) => (
                                    <li key={item.id} className="flex items-center gap-3 text-sm">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.subjectColor }} />
                                        <span className="flex-1 truncate">{item.subjectTitle || "Matéria removida"}</span>
                                        <span className="text-muted-foreground shrink-0">{formatMinutes(item.duration)}</span>
                                        <Badge variant={item.status === "CONCLUIDA" ? "secondary" : "outline"}>
                                            {item.status === "CONCLUIDA" ? "Concluída" : "Pulada"} · volta {item.lap}
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

            <CycleDragGhost ghost={ghost} elementRef={ghostRef} />

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

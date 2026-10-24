"use client";

import { moveTopicStatusAction } from "@/actions/topics.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Topic, TopicStatus } from "@/types/topic";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    useSensor,
    useSensors,
    type Announcements,
    type CollisionDetection,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import toast from "react-hot-toast";
import { KanbanCardContent } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import { ORDER_COOKIE, orderTopicsBySubject, type KanbanOrderMode, type SubjectOrders } from "./kanban-order";
import { KanbanOrderToggle } from "./kanban-order-toggle";
import { KanbanTopicSheet } from "./kanban-topic-sheet";
import { COLUMN_PAGE_SIZE, getColumn, KANBAN_COLUMNS, KANBAN_STATUSES } from "./kanban-config";
import {
    getClearedReviews,
    getOwnTitle,
    getReviewSummary,
    getScheduledReviews,
    sortByReviewUrgency,
} from "./kanban-utils";

type Move = { id: string; status: TopicStatus };
type PendingMove = { topic: Topic; to: TopicStatus };

const ALL_SUBJECTS = "all";
const ONE_YEAR = 60 * 60 * 24 * 365;

// Solta no card sob o ponteiro; sem ponteiro (ou fora de qualquer coluna) cai para a maior área sobreposta.
const detectCollisions: CollisionDetection = (args) => {
    const underPointer = pointerWithin(args);
    return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

function subscribeReducedMotion(onChange: () => void) {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

const subscribeNothing = () => () => { };

/** false no servidor e na hidratação, true no navegador: o portal só pode existir onde há `document`. */
function useIsClient() {
    return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

function usePrefersReducedMotion() {
    return useSyncExternalStore(
        subscribeReducedMotion,
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        () => false
    );
}

type KanbanBoardProps = {
    topics: Topic[];
    /** Matérias na ordem do cronograma e do ciclo, para a coluna "A estudar". */
    subjectOrders: SubjectOrders;
    /** Última ordem escolhida (vem do cookie). */
    initialOrderMode: KanbanOrderMode;
};

export function KanbanBoard({ topics, subjectOrders, initialOrderMode }: KanbanBoardProps) {
    const [, startTransition] = useTransition();
    const [subjectFilter, setSubjectFilter] = useState<string>(ALL_SUBJECTS);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [orderMode, setOrderMode] = useState<KanbanOrderMode>(initialOrderMode);
    const [limits, setLimits] = useState<Record<string, number>>({});
    const [confirm, setConfirm] = useState<PendingMove | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    // O painel guarda só o id: o assunto é lido do quadro, então a troca de coluna aparece nele na hora.
    const [detailId, setDetailId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    const isClient = useIsClient();

    // O card muda de coluna na hora; se a API falhar, o estado volta sozinho ao terminar a transição.
    const [boardTopics, applyMove] = useOptimistic(topics, (current: Topic[], move: Move) =>
        current.map((topic) =>
            topic.id === move.id
                ? { ...topic, status: move.status, reviews: move.status === "CONCLUIDO" ? getScheduledReviews() : getClearedReviews() }
                : topic
        )
    );

    const sensors = useSensors(
        // O arrasto só começa depois de mover 6 px: clique nos botões do card continua funcionando.
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        // No celular, segurar o dedo ~0,2 s começa o arrasto; arrastar logo de cara continua rolando a tela.
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
    );

    const subjects = [...new Map(boardTopics.map((topic) => [topic.subject.id, topic.subject])).values()].sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR")
    );

    // Se a matéria filtrada sumir (ex.: foi desativada), volta para "Todas".
    const activeFilter = subjects.some((subject) => subject.id === subjectFilter) ? subjectFilter : ALL_SUBJECTS;
    const visibleTopics =
        activeFilter === ALL_SUBJECTS ? boardTopics : boardTopics.filter((topic) => topic.subject.id === activeFilter);

    // Só segue cronograma/ciclo se houver matérias neles; senão volta para a ordem padrão.
    const orderAvailable: Record<KanbanOrderMode, boolean> = {
        padrao: true,
        cronograma: subjectOrders.cronograma.length > 0,
        ciclo: subjectOrders.ciclo.length > 0,
    };
    const activeOrder = orderAvailable[orderMode] ? orderMode : "padrao";

    const topicsByStatus = KANBAN_COLUMNS.map((column) => {
        const inColumn = visibleTopics.filter((topic) => topic.status === column.status);

        if (column.status === "CONCLUIDO") return { column, topics: sortByReviewUrgency(inColumn) };
        if (column.status === "PENDENTE" && activeOrder !== "padrao") {
            return { column, topics: orderTopicsBySubject(inColumn, subjectOrders[activeOrder]) };
        }
        return { column, topics: inColumn };
    });

    function changeOrderMode(mode: KanbanOrderMode) {
        setOrderMode(mode);
        document.cookie = `${ORDER_COOKIE}=${mode}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
    }

    const activeTopic = activeId ? boardTopics.find((topic) => topic.id === activeId) ?? null : null;

    function moveTopic(topic: Topic, to: TopicStatus) {
        if (topic.status === to) return;

        const column = getColumn(to);
        const toastId = `kanban-move-${topic.id}`;

        startTransition(async () => {
            applyMove({ id: topic.id, status: to });

            try {
                const result = await moveTopicStatusAction(topic.id, to);

                if (result.success) {
                    toast.success(to === "CONCLUIDO" ? `Movido para ${column.title}. Revisões agendadas.` : `Movido para ${column.title}.`, { id: toastId });
                } else {
                    toast.error(result.message, { id: toastId });
                }
            } catch (error) {
                console.error("Falha ao mover o assunto", error);
                toast.error("Não foi possível mover o assunto.", { id: toastId });
            }
        });
    }

    // Sair de "Concluído" apaga as datas e o progresso das revisões: pede confirmação se já houve revisão feita.
    function requestMove(topic: Topic, to: TopicStatus) {
        if (topic.status === to) return;

        if (topic.status === "CONCLUIDO" && getReviewSummary(topic).done > 0) {
            setConfirm({ topic, to });
            setConfirmOpen(true);
            return;
        }

        moveTopic(topic, to);
    }

    const detailTopic = detailId ? boardTopics.find((topic) => topic.id === detailId) ?? null : null;

    function openDetail(topic: Topic) {
        setDetailId(topic.id);
        setDetailOpen(true);
    }

    function moveFromDetail(topic: Topic, to: TopicStatus) {
        // O próprio painel já pediu a confirmação da troca, então move direto.
        if (topic.status !== to) moveTopic(topic, to);
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(String(event.active.id));
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveId(null);

        const topic = boardTopics.find((item) => item.id === event.active.id);
        const target = event.over ? String(event.over.id) : null;

        if (!topic || !target || !KANBAN_STATUSES.has(target)) return;

        requestMove(topic, target as TopicStatus);
    }

    function handleShowMore(status: TopicStatus) {
        setLimits((current) => ({ ...current, [status]: (current[status] ?? COLUMN_PAGE_SIZE) + COLUMN_PAGE_SIZE }));
    }

    const titleOf = (id: string | number) => {
        const topic = boardTopics.find((item) => item.id === id);
        return topic ? getOwnTitle(topic) : "assunto";
    };

    const announcements: Announcements = {
        onDragStart: ({ active }) => `Segurando ${titleOf(active.id)}.`,
        onDragOver: ({ over }) =>
            over && KANBAN_STATUSES.has(String(over.id)) ? `Sobre a coluna ${getColumn(over.id as TopicStatus).title}.` : undefined,
        onDragEnd: ({ active, over }) =>
            over && KANBAN_STATUSES.has(String(over.id))
                ? `${titleOf(active.id)} solto em ${getColumn(over.id as TopicStatus).title}.`
                : `${titleOf(active.id)} solto fora das colunas.`,
        onDragCancel: ({ active }) => `Movimento de ${titleOf(active.id)} cancelado.`,
    };

    if (topics.length === 0) {
        return (
            <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
                <p className="font-medium">Nenhum assunto para organizar</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                    Crie uma matéria e adicione assuntos a ela. Eles aparecem aqui, prontos para arrastar.
                </p>
                <Link href="/materias" className={buttonVariants({ variant: "default" })}>
                    Ir para Matérias
                </Link>
            </div>
        );
    }

    const confirmColumn = confirm ? getColumn(confirm.to) : null;

    return (
        <div className="flex flex-col gap-4">
            {subjects.length > 1 && (
                <div role="group" aria-label="Filtrar por matéria" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                    {[{ id: ALL_SUBJECTS, title: "Todas", color: null }, ...subjects].map((subject) => {
                        const selected = activeFilter === subject.id;

                        return (
                            <button
                                key={subject.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setSubjectFilter(subject.id)}
                                className={cn(
                                    "inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                                    selected
                                        ? "bg-foreground/12 font-medium text-foreground"
                                        : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                                )}
                            >
                                {subject.color && (
                                    <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                                )}
                                {subject.title}
                            </button>
                        );
                    })}
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={detectCollisions}
                accessibility={{ announcements }}
                // Rolagem automática mais lenta: no celular as colunas são largas e o padrão passava direto da coluna do meio.
                autoScroll={{ acceleration: 4, threshold: { x: 0.18, y: 0.2 } }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                {/*
                  * Durante o arrasto o snap fica desligado: com `snap-mandatory`, cada passo da rolagem automática
                  * era "puxado" para a próxima coluna e o card ia direto para a última. Ao soltar, o snap volta.
                  */}
                <div
                    className={cn(
                        "-mx-4 flex items-start gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0",
                        activeId === null ? "snap-x snap-mandatory" : "snap-none"
                    )}
                >
                    {topicsByStatus.map(({ column, topics: columnTopics }) => (
                        <div key={column.status} className="w-[86%] shrink-0 snap-center sm:w-[60%] lg:w-auto">
                            <KanbanColumn
                                config={column}
                                topics={columnTopics}
                                visibleCount={limits[column.status] ?? COLUMN_PAGE_SIZE}
                                isDragActive={activeId !== null}
                                headerExtra={
                                    column.status === "PENDENTE" ? (
                                        <KanbanOrderToggle value={activeOrder} available={orderAvailable} onChange={changeOrderMode} />
                                    ) : undefined
                                }
                                onShowMore={handleShowMore}
                                onMove={requestMove}
                                onOpen={openDetail}
                            />
                        </div>
                    ))}
                </div>

                {/*
                  * No body, fora da página: a animação de entrada (`introduction-Page`) mantém um transform
                  * ativo e faria o card flutuante ser posicionado em relação a ela, longe do ponteiro.
                  */}
                {isClient &&
                    createPortal(
                        <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
                            {activeTopic ? <KanbanCardContent topic={activeTopic} overlay /> : null}
                        </DragOverlay>,
                        document.body
                    )}
            </DndContext>

            <KanbanTopicSheet topic={detailTopic} open={detailOpen && detailTopic !== null} onOpenChange={setDetailOpen} onMove={moveFromDetail} />

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mover para {confirmColumn?.title}?</DialogTitle>
                        <DialogDescription>
                            {confirm ? `“${getOwnTitle(confirm.topic)}”` : "Este assunto"} já tem revisões feitas. Ao tirá-lo de Concluído,
                            as datas e o progresso das revisões são apagados.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmOpen(false);
                                if (confirm) moveTopic(confirm.topic, confirm.to);
                            }}
                        >
                            Mover assunto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function KanbanSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-busy="true" aria-label="Carregando o quadro">
            {KANBAN_COLUMNS.map((column) => (
                <div key={column.status} className="glass flex flex-col gap-2 rounded-2xl p-4">
                    <Skeleton className="mb-2 h-8 w-1/2 rounded-lg" />
                    {[0, 1, 2].map((index) => (
                        <Skeleton key={index} className="h-16 rounded-xl" />
                    ))}
                </div>
            ))}
        </div>
    );
}

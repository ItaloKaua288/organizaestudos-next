import { getCycleAction } from "@/actions/cycle.actions";
import { getTimelinesAction } from "@/actions/timeline.actions";
import { getTopicsAction } from "@/actions/topics.actions";
import { PageHeader } from "@/components/page-header";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { KanbanBoard, KanbanSkeleton } from "./components/kanban-board";
import { getCycleSubjectOrder, getTimelineSubjectOrder, ORDER_COOKIE, parseOrderMode } from "./components/kanban-order";

export const metadata: Metadata = {
    title: "Quadro | Organiza Estudos",
};

async function KanbanContent() {
    // Ciclo e cronograma só definem a ordem da coluna "A estudar": se falharem, o quadro segue com a ordem padrão.
    const [topics, cycle, timelines, cookieStore] = await Promise.all([
        getTopicsAction(),
        getCycleAction().catch(() => null),
        getTimelinesAction().catch(() => []),
        cookies(),
    ]);

    const todayName = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

    return (
        <KanbanBoard
            topics={topics}
            subjectOrders={{
                cronograma: getTimelineSubjectOrder(timelines, todayName),
                ciclo: getCycleSubjectOrder(cycle),
            }}
            initialOrderMode={parseOrderMode(cookieStore.get(ORDER_COOKIE)?.value)}
        />
    );
}

export default function KanbanPage() {
    return (
        <section className="introduction-Page">
            <PageHeader
                title="Quadro"
                description="Arraste cada assunto entre as colunas conforme o estudo avança. Ao concluir, as revisões de 1, 7 e 30 dias são agendadas."
            />
            <Suspense fallback={<KanbanSkeleton />}>
                <KanbanContent />
            </Suspense>
        </section>
    );
}

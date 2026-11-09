import { getCycleAction } from "@/actions/cycle.actions";
import { getSubjectsAction } from "@/actions/subjects.actions";
import { getTimelinesAction } from "@/actions/timeline.actions";
import { getTopicsAction } from "@/actions/topics.actions";
import ProgressLabelDemo from "@/components/progress-label";
import { PageHeader } from "@/components/page-header";
import { ReviewItem } from "@/components/reviewSection";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes } from "@/app/(private)/cronograma/components/cycle-utils";
import { VIEW_COOKIE } from "@/app/(private)/cronograma/components/view-cookie";
import { getDueReview } from "@/lib/review-due";
import { cn } from "@/lib/utils";
import type { CycleSession } from "@/types/cycle";
import { ArrowRight, CalendarPlus, Check, ExternalLink, Play, Plus, RefreshCw, RotateCw } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";


export default async function DashboardPage() {
    const currentDayName = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        timeZone: 'America/Sao_Paulo'
    }).format(new Date());

    const [subjectsRes, topicsRes, timelineRes, cycle, cookieStore] = await Promise.all([
        getSubjectsAction(),
        getTopicsAction(),
        getTimelinesAction(),
        // Se o ciclo falhar, o dashboard segue sem ele.
        getCycleAction().catch(() => null),
        cookies(),
    ]);

    // Matérias desativadas não contam no dashboard (tópicos e cronograma já vêm filtrados pela API).
    const data = {
        subjects: subjectsRes.filter((subject) => subject.active !== false),
        topics: topicsRes,
        timeline: timelineRes,
    };

    const pendingTopics = data.topics.filter((t) => t.status !== "CONCLUIDO");
    const concludedTopics = data.topics.filter((t) => t.status === "CONCLUIDO");

    // Revisões de hoje + atrasadas (as mais atrasadas primeiro).
    const reviewTodayTopics = data.topics
        .map((topic) => ({ topic, due: getDueReview(topic) }))
        .filter((item): item is { topic: typeof item.topic; due: NonNullable<typeof item.due> } => item.due !== null)
        .sort((a, b) => b.due.overdueDays - a.due.overdueDays);

    const reviewTodaySubjects = reviewTodayTopics.map(({ topic }) => topic.subject);
    const timelineSubjects = data.timeline
        .filter(t => t.day.toLowerCase() === currentDayName.toLowerCase() && t.subject)
        .map(t => t.subject!);

    const scheduleSubjects = [
        ...new Map(
            [...timelineSubjects, ...reviewTodaySubjects].map(subject => [subject.id, subject])
        ).values()
    ];

    // "Estudar hoje" acompanha a forma de estudar escolhida em Cronograma (semanal ou ciclo); o padrão é o semanal.
    const studyMode = cookieStore.get(VIEW_COOKIE)?.value === "ciclo" ? "ciclo" : "cronograma";
    const CYCLE_HREF = "/cronograma?view=ciclo";
    const CYCLE_TODAY_LIMIT = 4;
    const cycleHasSessions = (cycle?.sessions ?? []).some((session) => !session.inactive && !session.removed);

    // Ciclo: a sessão atual e as próximas em aberto. Com "matérias por dia", mostra o dia atual do ciclo.
    const cycleTodaySessions = ((): CycleSession[] => {
        if (!cycle) return [];
        const currentIndex = cycle.sessions.findIndex((session) => session.id === cycle.currentSessionId);
        if (currentIndex < 0) return [];

        const isOpen = (session: CycleSession) =>
            !session.inactive && !session.removed && (session.status === "PENDENTE" || session.status === "EM_ANDAMENTO");

        if (cycle.sessionsPerDay > 0) {
            const start = Math.floor(currentIndex / cycle.sessionsPerDay) * cycle.sessionsPerDay;
            return cycle.sessions.slice(start, start + cycle.sessionsPerDay).filter(isOpen);
        }
        return cycle.sessions.slice(currentIndex).filter(isOpen).slice(0, CYCLE_TODAY_LIMIT);
    })();

    type TodayStudyItem = { key: string; subject: { id: string; title: string; color: string }; meta?: string; badge?: string };
    const todayStudyItems: TodayStudyItem[] = studyMode === "ciclo"
        ? cycleTodaySessions.map((session) => ({
            key: session.id,
            subject: session.subject,
            meta: formatMinutes(session.duration),
            badge: session.id === cycle?.currentSessionId
                ? (session.status === "EM_ANDAMENTO" ? "Estudando agora" : "Agora")
                : undefined,
        }))
        : scheduleSubjects.map((subject) => ({ key: subject.id, subject }));

    // Matérias de hoje (sem repetir), usadas também para escolher o próximo assunto a estudar.
    const subjectsToday = [
        ...new Map(todayStudyItems.map(({ subject }) => [subject.id, subject])).values()
    ];

    // Ação principal do dia: revisões vencidas > continuar/começar um assunto > planejar > criar matéria.
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    const lateReviews = reviewTodayTopics.filter(({ due }) => due.overdueDays > 0).length;

    // Assunto para estudar: das matérias de hoje, "Estudando" primeiro e depois "Pendente", na ordem do assunto.
    const statusRank = (status: string) => (status === "ESTUDANDO" ? 0 : 1);
    const nextTopicToStudy = (() => {
        for (const subject of subjectsToday) {
            const [first] = pendingTopics
                .filter((t) => t.subject.id === subject.id)
                .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.order - b.order);
            if (first) return first;
        }
        return null;
    })();

    type NextAction = {
        title: string;
        description: string;
        primary: { label: string; href: string; icon: typeof Play };
        secondary?: { label: string; href: string };
    };

    const studyAction = nextTopicToStudy
        ? {
            label: nextTopicToStudy.status === "ESTUDANDO" ? "Continuar estudando" : "Começar a estudar",
            href: `/materias/${nextTopicToStudy.subject.id}`,
        }
        : null;

    let nextAction: NextAction;
    if (reviewTodayTopics.length > 0) {
        nextAction = {
            title: "Seu próximo passo",
            description: lateReviews > 0
                ? `${plural(reviewTodayTopics.length, "revisão", "revisões")} para fazer, ${plural(lateReviews, "atrasada", "atrasadas")}.`
                : `${plural(reviewTodayTopics.length, "revisão", "revisões")} para fazer hoje.`,
            primary: { label: `Revisar agora (${reviewTodayTopics.length})`, href: "/revisoes", icon: RotateCw },
            secondary: studyAction ?? undefined,
        };
    } else if (nextTopicToStudy && studyAction) {
        nextAction = {
            title: "Seu próximo passo",
            description: `${nextTopicToStudy.subject.title} · ${nextTopicToStudy.title}`,
            primary: { ...studyAction, icon: Play },
        };
    } else if (pendingTopics.length > 0) {
        nextAction = studyMode === "ciclo"
            ? {
                title: cycleHasSessions ? "Ciclo sem assuntos pendentes" : "Nada marcado para hoje",
                description: cycleHasSessions
                    ? "As matérias do ciclo não têm assuntos pendentes. Adicione assuntos ou ajuste o ciclo."
                    : "Monte o ciclo de estudos para seguir as matérias em sequência, sem depender de dias fixos.",
                primary: { label: cycleHasSessions ? "Ajustar o ciclo" : "Montar o ciclo de estudos", href: CYCLE_HREF, icon: RefreshCw },
                secondary: { label: "Ver matérias", href: "/materias" },
            }
            : {
                title: "Nada marcado para hoje",
                description: "Você tem assuntos pendentes. Escolha quando estudar cada matéria no cronograma.",
                primary: { label: "Planejar no cronograma", href: "/cronograma", icon: CalendarPlus },
                secondary: { label: "Ver matérias", href: "/materias" },
            };
    } else if (data.subjects.length > 0) {
        nextAction = {
            title: "Comece pelos assuntos",
            description: "Adicione os assuntos de uma matéria para montar seu plano de estudo e as revisões.",
            primary: { label: "Adicionar assuntos", href: "/materias", icon: Plus },
        };
    } else {
        nextAction = {
            title: "Bem-vindo ao Organiza Estudos",
            description: "Crie sua primeira matéria para começar a organizar estudos e revisões.",
            primary: { label: "Criar primeira matéria", href: "/materias", icon: Plus },
        };
    }
    const NextActionIcon = nextAction.primary.icon;

    // Primeiros passos: some sozinho quando as 3 etapas estiverem concluídas.
    const onboardingSteps = [
        { label: "Criar uma matéria", hint: "Ex.: Português, Direito Constitucional.", done: subjectsRes.length > 0, href: "/materias", cta: "Criar matéria" },
        { label: "Adicionar assuntos", hint: "Liste os assuntos de cada matéria para acompanhar o progresso.", done: topicsRes.length > 0, href: "/materias", cta: "Adicionar assuntos" },
        { label: "Montar o cronograma ou o ciclo", hint: "Escolha os dias de estudo de cada matéria ou monte um ciclo em sequência.", done: timelineRes.length > 0 || cycleHasSessions, href: "/cronograma", cta: "Abrir cronograma" },
    ];
    const onboardingDone = onboardingSteps.filter((step) => step.done).length;
    const showOnboarding = onboardingDone < onboardingSteps.length;
    const currentStepIndex = onboardingSteps.findIndex((step) => !step.done);

    const progressPercentage = data.topics.length > 0
        ? (concludedTopics.length / data.topics.length) * 100
        : 0;

    const stats = [
        { label: "Matérias ativas", value: data.subjects.length },
        { label: "Assuntos pendentes", value: pendingTopics.length },
        { label: "Assuntos concluídos", value: concludedTopics.length },
    ];

    const weekday = currentDayName.charAt(0).toUpperCase() + currentDayName.slice(1);

    return (
        <main className="introduction-Page flex flex-col pb-8">
            <PageHeader
                title="Dashboard"
                description={`${weekday}: veja o que estudar e revisar hoje.`}
            />

            <div className="flex flex-col gap-4">
                <section
                    aria-label="Próximo passo"
                    className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="min-w-0 space-y-1">
                        <h2 className="text-sm font-medium text-muted-foreground">{nextAction.title}</h2>
                        <p className="text-lg font-semibold tracking-tight text-balance sm:text-xl">{nextAction.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={nextAction.primary.href} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                            <NextActionIcon data-icon="inline-start" />
                            {nextAction.primary.label}
                        </Link>
                        {nextAction.secondary && (
                            <Link href={nextAction.secondary.href} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
                                {nextAction.secondary.label}
                                <ArrowRight data-icon="inline-end" />
                            </Link>
                        )}
                    </div>
                </section>

                {showOnboarding && (
                    <section aria-label="Primeiros passos" className="glass flex flex-col gap-3 rounded-2xl p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-semibold">Primeiros passos</h2>
                            <Badge variant="secondary">{onboardingDone} de {onboardingSteps.length}</Badge>
                        </div>
                        <ol className="flex flex-col gap-1">
                            {onboardingSteps.map((step, index) => (
                                <li key={step.label} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
                                    <span
                                        className={cn(
                                            "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                                            step.done ? "border-transparent bg-primary text-primary-foreground" : "border-(--glass-ring) text-muted-foreground"
                                        )}
                                    >
                                        {step.done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className={cn("text-sm font-medium", step.done && "text-muted-foreground line-through")}>
                                            {step.label}
                                            {step.done && <span className="sr-only"> (concluído)</span>}
                                        </p>
                                        {!step.done && <p className="text-xs text-muted-foreground">{step.hint}</p>}
                                    </div>
                                    {index === currentStepIndex && (
                                        <Link href={step.href} className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
                                            {step.cta}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                <section aria-label="Resumo" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label} size="sm">
                            <CardContent className="flex flex-col gap-1">
                                <span className="text-sm text-muted-foreground">{stat.label}</span>
                                <span className="font-heading text-4xl font-semibold tabular-nums tracking-tight">{stat.value}</span>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Progresso geral</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProgressLabelDemo
                                value={Number(progressPercentage.toFixed(2))}
                                label="Progresso geral"
                                description="dos assuntos foram concluídos"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                Estudar hoje
                                <Badge variant="secondary">{todayStudyItems.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-2 text-xs text-muted-foreground">
                                {studyMode === "ciclo" ? "Seguindo o ciclo de estudos." : "Seguindo o cronograma semanal."}
                            </p>
                            {!todayStudyItems.length ? (
                                studyMode === "ciclo" ? (
                                    <div className="flex flex-col items-start gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {cycleHasSessions ? "Nenhuma sessão em aberto no ciclo." : "Você ainda não montou o ciclo de estudos."}
                                        </p>
                                        <Link href={CYCLE_HREF} className={buttonVariants({ variant: "outline", size: "sm" })}>
                                            <RefreshCw data-icon="inline-start" />
                                            {cycleHasSessions ? "Abrir o ciclo" : "Montar o ciclo de estudos"}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-start gap-3">
                                        <p className="text-sm text-muted-foreground">Nenhum estudo marcado para hoje.</p>
                                        <Link href="/cronograma" className={buttonVariants({ variant: "outline", size: "sm" })}>
                                            <CalendarPlus data-icon="inline-start" />
                                            Planejar no cronograma
                                        </Link>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                                        {todayStudyItems.map((item) => (
                                            <Link
                                                key={item.key}
                                                href={`/materias/${item.subject.id}`}
                                                className="group/row flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                            >
                                                <span className="flex min-w-0 items-center gap-2.5">
                                                    <span
                                                        className="size-2.5 shrink-0 rounded-full"
                                                        style={{ backgroundColor: item.subject.color }}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate text-sm">{item.subject.title}</span>
                                                    {item.badge && <Badge className="shrink-0">{item.badge}</Badge>}
                                                </span>
                                                <span className="flex shrink-0 items-center gap-2">
                                                    {item.meta && <span className="text-xs text-muted-foreground">{item.meta}</span>}
                                                    <ExternalLink className="size-4 text-muted-foreground transition-colors group-hover/row:text-foreground" />
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                    {studyMode === "ciclo" && (
                                        <Link href={CYCLE_HREF} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}>
                                            Abrir o ciclo
                                            <ArrowRight data-icon="inline-end" />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                Revisar hoje
                                <Badge variant="secondary">{reviewTodayTopics.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-96 overflow-y-auto">
                            {!reviewTodayTopics.length ? (
                                <div className="flex flex-col items-start gap-3">
                                    <p className="text-sm text-muted-foreground">Nenhuma revisão para hoje nem atrasada.</p>
                                    <Link href="/revisoes" className={buttonVariants({ variant: "outline", size: "sm" })}>
                                        Ver todas as revisões
                                        <ArrowRight data-icon="inline-end" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {reviewTodayTopics.map(({ topic, due }) => (
                                        <div key={topic.id} className="py-1 first:pt-0 last:pb-0">
                                            <ReviewItem item={topic} reviewIndex={due.number} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Calendário</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                className="w-full max-w-65 rounded-xl p-1"
                                classNames={{
                                    today: "rounded-md bg-primary text-primary-foreground font-semibold",
                                }}
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    )
}

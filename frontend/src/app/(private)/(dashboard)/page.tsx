import { getSubjectsAction } from "@/actions/subjects.actions";
import { getTimelinesAction } from "@/actions/timeline.actions";
import { getTopicsAction } from "@/actions/topics.actions";
import ProgressLabelDemo from "@/components/progress-label";
import { PageHeader } from "@/components/page-header";
import { TopicSheetTrigger } from "@/components/topic-sheet-trigger";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDueReview } from "@/lib/review-due";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";


export default async function DashboardPage() {
    const currentDayName = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        timeZone: 'America/Sao_Paulo'
    }).format(new Date());

    const [subjectsRes, topicsRes, timelineRes] = await Promise.all([
        getSubjectsAction(),
        getTopicsAction(),
        getTimelinesAction()
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

    const subjectsToday = [
        ...new Map(
            [...timelineSubjects, ...reviewTodaySubjects].map(subject => [subject.id, subject])
        ).values()
    ];

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
                                <Badge variant="secondary">{subjectsToday.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!subjectsToday.length ? (
                                <p className="text-sm text-muted-foreground">Nenhum estudo marcado para hoje.</p>
                            ) : (
                                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                                    {subjectsToday.map((subject) => (
                                        <Link
                                            key={subject.id}
                                            href={`/materias/${subject.id}`}
                                            className="group/row flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                        >
                                            <span className="flex min-w-0 items-center gap-2.5">
                                                <span
                                                    className="size-2.5 shrink-0 rounded-full"
                                                    style={{ backgroundColor: subject.color }}
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate text-sm">{subject.title}</span>
                                            </span>
                                            <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground" />
                                        </Link>
                                    ))}
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
                        <CardContent className="max-h-72 overflow-y-auto">
                            {!reviewTodayTopics.length ? (
                                <p className="text-sm text-muted-foreground">Nenhuma revisão para hoje nem atrasada.</p>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {reviewTodayTopics.map(({ topic, due }) => (
                                        <TopicSheetTrigger
                                            key={topic.id}
                                            topic={topic}
                                            className="h-auto w-full justify-start rounded-xl border-0 bg-transparent px-2.5 py-2.5 shadow-none backdrop-blur-none hover:bg-foreground/6"
                                        >
                                            <div className="flex w-full items-center gap-3 truncate">
                                                <BookOpen className="size-4 shrink-0" style={{ color: topic.subject.color }} />
                                                <div className="flex min-w-0 flex-col items-start gap-0.5">
                                                    <span className="max-w-full truncate text-sm">{topic.title}</span>
                                                    <span className="max-w-full truncate text-xs text-muted-foreground">{topic.subject.title}</span>
                                                </div>
                                                {due.overdueDays > 0 && (
                                                    <Badge variant="destructive" className="ml-auto shrink-0">Atrasada {due.overdueDays}d</Badge>
                                                )}
                                            </div>
                                        </TopicSheetTrigger>
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

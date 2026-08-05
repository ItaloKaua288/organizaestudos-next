import { DialogDemo } from "@/components/dialog-button";
import ProgressLabelDemo from "@/components/progress-label";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubjects } from "@/services/subjects.service";
import { getTimeline } from "@/services/timeline.service";
import { getTopics } from "@/services/topics.service";
import { AlertCircle, BadgeCheck, BookOpen, ClipboardClock } from "lucide-react";
import { ScrambleText } from "@/components/scramble-text";


function isReviewScheduledForToday(reviewDateString?: string | Date) {
    if (!reviewDateString) return false;

    const reviewDateUTC = new Date(reviewDateString);
    if (isNaN(reviewDateUTC.getTime())) return false;

    const reviewDate = new Date(
        reviewDateUTC.getUTCFullYear(),
        reviewDateUTC.getUTCMonth(),
        reviewDateUTC.getUTCDate()
    );

    const brString = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const todayBR = new Date(brString);
    todayBR.setHours(0, 0, 0, 0);

    return todayBR.getTime() === reviewDate.getTime();
}

export default async function DashboardPage() {
    const currentDayName = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        timeZone: 'America/Sao_Paulo'
    }).format(new Date());

    let data = null;

    try {
        const [subjectsRes, topicsRes, timelineRes] = await Promise.all([
            getSubjects(),
            getTopics(),
            getTimeline()
        ]);
        data = { subjects: subjectsRes, topics: topicsRes, timeline: timelineRes };
    } catch (error) {
        console.error("Falha ao carregar os dados do dashboard:", error);
        return (
            <main className="flex min-h-screen items-center justify-center p-4">
                <div className="flex flex-col items-center gap-2 text-destructive">
                    <AlertCircle size={40} />
                    <h2 className="text-xl font-bold">Erro ao carregar dados</h2>
                    <p className="text-muted-foreground text-sm">Não foi possível conectar ao servidor.</p>
                </div>
            </main>
        );
    }

    const pendingTopics = data.topics.filter((t) => t.status === "PENDENTE");
    const concludedTopics = data.topics.filter((t) => t.status === "CONCLUIDO");

    const reviewTodayTopics = data.topics.filter((topic) =>
        Object.values(topic.reviews || {}).some(
            (review) => !review.concluded && isReviewScheduledForToday(review.date)
        )
    );

    const reviewTodaySubjects = reviewTodayTopics.map(topic => topic.subject);
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

    return (
        <main className="flex min-h-screen flex-col space-y-4 pb-8">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    <ScrambleText text="DASHBOARD" />
                </h1>
            </header>
            <section className=" flex flex-col space-y-4">

                <div className="gap-4  px-2 grid grid-cols-1 md:grid-cols-3 w-full">
                    <Card className="introduction-card" style={{ animationDelay: `${1 * 150}ms` }} >
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                            <CardTitle className="text-sm font-medium">Matérias</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <span className="text-2xl font-bold">{data.subjects.length}</span>
                        </CardContent>
                    </Card>

                    <Card className="introduction-card" style={{ animationDelay: `${1 * 150}ms` }} >
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                            <CardTitle className="text-sm font-medium">Assuntos Pendentes</CardTitle>
                            <ClipboardClock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <span className="text-2xl font-bold">{pendingTopics.length}</span>
                        </CardContent>
                    </Card>

                    <Card className="introduction-card" style={{ animationDelay: `${1 * 150}ms` }} >
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                            <CardTitle className="text-sm font-medium">Assuntos Concluídos</CardTitle>
                            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <span className="text-2xl font-bold">{concludedTopics.length}</span>
                        </CardContent>
                    </Card>
                </div>

                <section className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2">

                    <Card className="flex flex-col justify-start introduction-card" style={{ animationDelay: `${2 * 150}ms` }} >
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                            <CardTitle className="text-sm font-medium">Desempenho</CardTitle>
                            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <ProgressLabelDemo
                                value={Number(progressPercentage.toFixed(2))}
                                label="Progresso Geral"
                                description="dos assuntos foram concluídos"
                            />
                        </CardContent>
                    </Card>
                    <Card className="introduction-card" style={{ animationDelay: `${2 * 150}ms` }} >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-1">Estudar Hoje <Badge className="w-5.5 h-5.5 p-0" variant="secondary">{subjectsToday.length}</Badge></CardTitle>
                            {currentDayName && <Badge variant="outline">{currentDayName}</Badge>}
                        </CardHeader>
                        <CardContent>
                            {
                                !subjectsToday.length ? (
                                    <p className="text-sm text-muted-foreground">Nenhum estudo pendente para hoje.</p>
                                ) : (
                                    <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                                        {subjectsToday.map((subject) => (
                                            <div key={subject.id} className="flex gap-1 items-center p-2 rounded-sm hoverComponentsStatic">
                                                <span
                                                    className="mr-2 h-2 w-2 shrink-0 rounded-full"
                                                    style={{ backgroundColor: subject.color }}
                                                />
                                                <span className="truncate">{subject.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid grid-cols-1 gap-4 px-2 md:grid-cols-3">
                    <Card className="md:col-span-2 introduction-card" style={{ animationDelay: `${3 * 150}ms` }} >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                Revisar Hoje
                                <Badge className="w-5.5 h-5.5 p-0" variant="secondary">{reviewTodayTopics.length}</Badge>
                            </CardTitle>
                            {currentDayName && <Badge variant="outline">{currentDayName}</Badge>}
                        </CardHeader>
                        <CardContent className="max-h-60 overflow-y-auto pb-4 ">
                            {!reviewTodayTopics.length ? (
                                <p className="text-sm text-muted-foreground">Nenhuma revisão agendada para hoje.</p>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {reviewTodayTopics.map((topic) => (
                                        <DialogDemo
                                            key={topic.id}
                                            title={topic.title}
                                            description="Informações sobre o tópico da revisão"
                                            contentBtn={
                                                <div className="flex items-center gap-2">
                                                    <BookOpen style={{ color: topic.subject.color }} />
                                                    <div className="flex flex-col  items-start gap-1 ">
                                                        <span>{topic.title}</span>
                                                        <span className="text-xs text-muted-foreground">{topic.subject.title}</span>
                                                    </div>
                                                </div>

                                            }
                                            disableBtns={true}
                                            classNameBtn="flex items-center justify-start hoverComponentsStatic border-0 py-6 rounded-sm"
                                        >
                                            <TopicInfoGroup subject={topic.subject.title} color={topic.subject.color} topic={topic} hasAttachments={!!topic.attachments?.length} />
                                        </DialogDemo>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="introduction-card" style={{ animationDelay: `${3 * 150}ms` }} >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Calendário</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center pt-0">
                            <Calendar
                                className="rounded-xl border p-3 max-w-65 w-full"
                                classNames={{
                                    today: "rounded-md bg-primary text-primary-foreground font-semibold",
                                }}
                            />
                        </CardContent>
                    </Card>
                </section>
            </section>
        </main>
    )
}
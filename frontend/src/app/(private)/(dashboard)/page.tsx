"use client"

import { BookOpen, ClipboardClock, BadgeCheck } from "lucide-react";
import ProgressLabelDemo from "@/components/progress-label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTopics } from "@/services/topics.service";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar";
import { getSubjects } from "@/services/subjects.service";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Topic } from "@/types/topic";
import { Subject } from "@/types/subject";
import { ptBR } from "date-fns/locale";
import { isToday } from "date-fns";
import { Timeline } from "@/types/timeline";
import { getTimeline } from "@/services/timeline.service";
import { DialogDemo } from "@/components/dialog-button";
import { TopicInfoGroup } from "@/components/topic-info-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";


const subscribeToCurrentDay = () => () => { }

const getBrowserCurrentDay = () =>
    new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
    }).format(new Date())

const getServerCurrentDay = () => ""

export default function DashboardPage() {
    const [topics, setTopics] = useState<Topic[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [timelines, setTimelines] = useState<Timeline[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const currentDay = useSyncExternalStore(
        subscribeToCurrentDay,
        getBrowserCurrentDay,
        getServerCurrentDay
    )

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true)
                const [topicsData, subjectsData, timelinesData] = await Promise.all([
                    getTopics(),
                    getSubjects(),
                    getTimeline(),
                ])
                setTopics(topicsData)
                setSubjects(subjectsData)
                setTimelines(timelinesData)
            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const { pendingTopics, concludedTopics, reviewTodayTopics, subjectsToday } = useMemo(() => {
        const pending = topics.filter((topic) => topic.status === "PENDENTE")
        const concluded = topics.filter((topic) => topic.status === "CONCLUIDO")

        const reviewToday = topics.filter((topic) =>
            Object.values(topic.reviews || {}).some((review) => {
                if (!review.date || review.concluded) {
                    return false;
                }
                const reviewDate = new Date(review.date);
                const adjustedDate = new Date(
                    reviewDate.getUTCFullYear(),
                    reviewDate.getUTCMonth(),
                    reviewDate.getUTCDate()
                );
                return isToday(adjustedDate);
            })
        );

        const reviewTodaySubjects = reviewToday.map(topic => topic.subject);

        const timelineSubjects = timelines
            .filter(timeline => timeline.day.toLowerCase() === currentDay.toLowerCase() && timeline.subject)
            .map(timeline => timeline.subject!);

        const subjectsToday = [
            ...new Map(
                [...timelineSubjects, ...reviewTodaySubjects]
                    .map(subject => [subject.id, subject])
            ).values()
        ];

        return {
            pendingTopics: pending,
            concludedTopics: concluded,
            reviewTodayTopics: reviewToday,
            subjectsToday,
        };
    }, [topics, timelines, currentDay])

    const progressPercentage = topics.length > 0
        ? (concludedTopics.length / topics.length) * 100
        : 0

    return (
        <main className="flex min-h-screen flex-col space-y-4 pb-8">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    Dashboard
                </h1>
            </header>
            <div className="gap-4 py-2 px-2 grid grid-cols-1 md:grid-cols-3 w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                        <CardTitle className="text-sm font-medium">Matérias</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Spinner className="my-2" /> : <span className="text-2xl font-bold">{subjects.length}</span>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                        <CardTitle className="text-sm font-medium">Assuntos Pendentes</CardTitle>
                        <ClipboardClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Spinner className="my-2" /> : <span className="text-2xl font-bold">{pendingTopics.length}</span>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                        <CardTitle className="text-sm font-medium">Assuntos Concluídos</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Spinner className="my-2" /> : <span className="text-2xl font-bold">{concludedTopics.length}</span>}

                    </CardContent>
                </Card>
            </div>

            <section className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2">
                <div className="flex flex-col justify-start">
                    {isLoading ?
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 justify-between">
                                <CardTitle className="text-sm font-medium">Desempenho</CardTitle>
                                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2 py-2 px-6">
                                <div className="flex justify-between items-center">
                                    <span className="p-0 m-0">Progresso Geral</span>
                                    <Spinner className="" />
                                </div>
                                <Skeleton className="h-1 w-full mt-1"></Skeleton>
                                <div className="flex gap-1 items-center">
                                    <Spinner className="" /> <span className="p-0 m-0 ">dos assuntos foram concluídos</span>
                                </div>
                            </CardContent>
                        </Card> :

                        <Card className="flex flex-col justify-start">
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
                    }

                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-1">Estudar Hoje {isLoading ? <Badge className="w-5.5 h-5.5 p-0" variant="secondary"> <Spinner className="" /></Badge> : <Badge className="w-5.5 h-5.5 p-0" variant="secondary">{subjectsToday.length}</Badge>} </CardTitle>
                        {isLoading ? <Skeleton className="w-20 h-5 rounded-lg"></Skeleton> : currentDay && <Badge variant="outline">{currentDay}</Badge>}
                    </CardHeader>
                    <CardContent>
                        {isLoading ?
                            <div className="flex flex-col gap-1">
                                <div className="hoverComponentsStatic w-full h-9 rounded-sm flex flex-col justify-center p-2">
                                    <div className="flex gap-2">
                                        <Skeleton className="w-3 h-3" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                                <div className="hoverComponentsStatic w-full h-9 rounded-sm flex flex-col justify-center p-2">
                                    <div className="flex gap-2">
                                        <Skeleton className="w-3 h-3" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                            </div> :
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
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            Revisar Hoje
                            {isLoading ? <Badge className="w-5.5 h-5.5 p-0" variant="secondary"> <Spinner className="" /></Badge> : <Badge className="w-5.5 h-5.5 p-0" variant="secondary">{reviewTodayTopics.length}</Badge>}
                        </CardTitle>
                        {isLoading ? <Skeleton className="w-20 h-5 rounded-lg"></Skeleton> : currentDay && <Badge variant="outline">{currentDay}</Badge>}
                    </CardHeader>
                    <CardContent className="max-h-60 overflow-y-auto pb-4 ">
                        {isLoading ?
                            <div className="">
                                <div className="w-full h-12 mt-1.5 rounded-sm px-2 flex items-center gap-1 hoverComponentsStatic">
                                    <Skeleton className="w-5 h-5" />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="w-20 h-3" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                                <div className="w-full h-12 mt-1.5 rounded-sm px-2 flex items-center gap-1 hoverComponentsStatic">
                                    <Skeleton className="w-5 h-5" />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="w-20 h-3" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                                <div className="w-full h-12 mt-1.5 rounded-sm px-2 flex items-center gap-1 hoverComponentsStatic">
                                    <Skeleton className="w-5 h-5" />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="w-20 h-3" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>
                                <div className="w-full h-12 mt-1.5 rounded-sm px-2 flex items-center gap-1 hoverComponentsStatic">
                                    <Skeleton className="w-5 h-5" />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="w-20 h-3" />
                                        <Skeleton className="w-20 h-3" />
                                    </div>
                                </div>

                            </div> : !reviewTodayTopics.length ? (
                                <p className="text-sm text-muted-foreground">Nenhuma revisão agendada para hoje.</p>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <span></span>

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

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Calendário</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center pt-0">
                        <Calendar
                            locale={ptBR}
                            className="rounded-xl border p-3 max-w-65 w-full"
                            classNames={{
                                today: "rounded-md bg-primary text-primary-foreground font-semibold",
                            }}
                        />
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}

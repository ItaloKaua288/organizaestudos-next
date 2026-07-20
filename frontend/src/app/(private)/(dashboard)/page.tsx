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
import { Subject, Topic } from "@/types/topic";
import { ptBR } from "date-fns/locale";
import { isToday } from "date-fns";


const subscribeToCurrentDay = () => () => { }

const getBrowserCurrentDay = () =>
    new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
    }).format(new Date())

const getServerCurrentDay = () => ""

export default function DashboardPage() {
    const [topics, setTopics] = useState<Topic[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])

    const currentDay = useSyncExternalStore(
        subscribeToCurrentDay,
        getBrowserCurrentDay,
        getServerCurrentDay
    )

    useEffect(() => {
        async function loadData() {
            try {
                const [topicsData, subjectsData] = await Promise.all([
                    getTopics(),
                    getSubjects(),
                ])
                setTopics(topicsData)
                setSubjects(subjectsData)
            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error)
            }
        }
        loadData()
    }, [])

    const { pendingTopics, concludedTopics, reviewTodayTopics } = useMemo(() => {
        const pending = topics.filter((topic) => topic.status === "PENDENTE")
        const concluded = topics.filter((topic) => topic.status === "CONCLUIDO")

        const reviewToday = topics.filter((topic) =>
            Object.values(topic.reviews || {}).some(
                (review) => !review.concluded && isToday(new Date(review.date))
            )
        )

        return {
            pendingTopics: pending,
            concludedTopics: concluded,
            reviewTodayTopics: reviewToday,
        }
    }, [topics])

    const progressPercentage = topics.length > 0
        ? (concludedTopics.length / topics.length) * 100
        : 0

    return (
        <main className="flex min-h-screen flex-col space-y-4 pb-8">
            <header className="space-y-1">
                <h1 className="bg-card py-2 px-2 text-xl font-bold shadow-sm">
                    Dashboard
                </h1>
            </header>
            <div className="gap-4 py-2 px-2 grid grid-cols-1 md:grid-cols-3 w-full">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Matérias</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold">{subjects.length}</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <ClipboardClock className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Assuntos Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold">{pendingTopics.length}</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Assuntos Concluídos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold">{concludedTopics.length}</span>
                    </CardContent>
                </Card>
            </div>

            <section className="grid grid-cols-1 gap-4 px-2 md:grid-cols-2">
                <Card className="flex flex-col justify-between">
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Desempenho</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProgressLabelDemo
                            value={progressPercentage}
                            label="Progresso Geral"
                            description="dos assuntos foram concluídos"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Estudar Hoje</CardTitle>
                        {currentDay && <Badge variant="outline">{currentDay}</Badge>}
                    </CardHeader>
                    <CardContent>
                        {!pendingTopics.length ? (
                            <p className="text-sm text-muted-foreground">Nenhum estudo pendente para hoje.</p>
                        ) : (
                            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
                                {pendingTopics.map((topic) => (
                                    <Button
                                        key={`study-${topic.id}`}
                                        variant="outline"
                                        className="h-auto w-full justify-start py-2"
                                        render={
                                            <Link href={`/topicos/${topic.id}`}>
                                                <span
                                                    className="mr-2 h-2 w-2 shrink-0 rounded-full"
                                                    style={{ backgroundColor: topic.subject.color || "#ccc" }}
                                                />
                                                <span className="truncate">{topic.title}</span>
                                            </Link>
                                        }
                                    />
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
                            <Badge variant="secondary">{reviewTodayTopics.length}</Badge>
                        </CardTitle>
                        {currentDay && <Badge variant="outline">{currentDay}</Badge>}
                    </CardHeader>
                    <CardContent className="max-h-60 overflow-y-auto pb-4 pr-1">
                        {!reviewTodayTopics.length ? (
                            <p className="text-sm text-muted-foreground">Nenhuma revisão agendada para hoje.</p>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {reviewTodayTopics.map((topic) => (
                                    <Button
                                        key={`review-${topic.id}`}
                                        variant="outline"
                                        className="h-auto w-full justify-start py-2"
                                        render={
                                            <Link href={`/revisao/${topic.id}`} className="flex items-center gap-2">
                                                <BookOpen
                                                    className="h-4 w-4 shrink-0"
                                                    style={{ color: topic.subject.color }}
                                                />
                                                <div className="flex min-w-0 flex-col text-left">
                                                    <span className="truncate font-medium">{topic.title}</span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {topic.subject.title}
                                                    </span>
                                                </div>
                                            </Link>
                                        }
                                    />
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
                            className="rounded-xl border p-3 shadow-sm max-w-65 w-full"
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

"use client"

import { Button } from "@/components/ui/button"
import { PencilIcon, Plus, Trash2, BookOpen, Paperclip, FileText } from "lucide-react"
import { DialogDemo } from "@/components/dialog-button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { Topic } from "@/types/topic"
import { Timeline } from "@/types/timeline"
import { getTimeline } from "@/services/timeline.service"
import { getTopics } from "@/services/topics.service"
import { Field, FieldGroup } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const WEEK_DAYS = [
    "Segunda", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
]

const subscribeToCurrentDay = () => () => { }

const getBrowserCurrentDay = () =>
    new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
    }).format(new Date())

const getServerCurrentDay = () => ""

export default function CronogramaPage() {
    const [timeline, setTimeline] = useState<Timeline[]>([])
    const [topics, setTopics] = useState<Topic[]>([])
    const currentDay = useSyncExternalStore(
        subscribeToCurrentDay,
        getBrowserCurrentDay,
        getServerCurrentDay
    )

    useEffect(() => {
        async function loadData() {
            try {
                const [timelineData, topicsData] = await Promise.all([
                    getTimeline(),
                    getTopics()
                ])
                setTimeline(timelineData)
                setTopics(topicsData)
            } catch (error) {
                console.error("Erro ao carregar cronograma:", error)
            }
        }
        loadData()
    }, [])

    const { timelineByDay, activeTopicsMap } = useMemo(() => {
        const topicsMap = new Map<string, Topic>()
        topics.forEach((topic) => {
            if (topic.status !== "CONCLUIDO") {
                topicsMap.set(topic.subject.id, topic)
            }
        })

        const grouped: Record<string, Timeline[]> = {}
        WEEK_DAYS.forEach(day => grouped[day] = [])

        timeline.forEach((item) => {
            if (grouped[item.day]) {
                grouped[item.day].push(item)
            }
        })

        return { timelineByDay: grouped, activeTopicsMap: topicsMap }
    }, [timeline, topics])

    return (
        <main className="space-y-4">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    Cronograma
                </h1>
                <div className="flex justify-between p-2 items-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        Gerencie seu cronograma.
                    </p>
                </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-2 pt-0 gap-3">
                {WEEK_DAYS.map((dayLabel) => {
                    const isToday =
                        currentDay !== "" &&
                        currentDay.toLowerCase() === dayLabel.toLowerCase()
                    const dayEvents = timelineByDay[dayLabel] || []

                    return (
                        <Card
                            key={dayLabel}
                            className={`border max-h-150 overflow-y-auto transition-all ${isToday ? "border border-primary/50 shadow-sm shadow-primary/50" : ""}`}
                        >
                            <CardHeader>
                                <CardTitle className="truncate">{dayLabel}</CardTitle>
                                <CardAction>
                                    <DialogDemo
                                        title="Adicionar Matéria"
                                        description=" "
                                        contentBtn={
                                            <div className="flex items-center gap-1">
                                                <Plus className="h-4 w-4" />
                                                <span>Adicionar</span>
                                            </div>
                                        }>
                                        <FieldGroup >
                                            <Field>
                                                <Label>Matéria:</Label>
                                                <Select>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Dias da Semana</SelectLabel>
                                                            {WEEK_DAYS.map((day) => (
                                                                <SelectItem key={day} value={day}>
                                                                    {day}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                            <Field className="grid grid-cols-2">
                                                <div className="flex flex-col gap-2">
                                                    <Label>Início:</Label>
                                                    <Input type="time" step={0} />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Label>Fim:</Label>
                                                    <Input type="time" step={0} />
                                                </div>
                                            </Field>
                                        </FieldGroup>
                                    </DialogDemo>
                                </CardAction>
                            </CardHeader>

                            <CardContent className="flex flex-col space-y-3 pb-4">
                                {dayEvents.map((item) => {
                                    const nextTopic = item.subject?.id ? activeTopicsMap.get(item.subject.id) : undefined
                                    const hasAttachments = nextTopic?.attachments && nextTopic.attachments.length > 0

                                    const scheduleCard = (
                                        <Card className="hover:border-primary/40 transition-colors">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <div className="flex flex-col gap-1 truncate">
                                                    <div className="flex gap-2 items-center">
                                                        <span
                                                            className="w-3 h-3 rounded-full shrink-0"
                                                            style={{ backgroundColor: item.subject?.color || "#ccc" }}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="font-medium truncate text-sm">
                                                            {item.subject?.title || "Sem matéria"}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.start_time} - {item.end_time}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            {nextTopic && (
                                                <CardFooter className="py-2 bg-muted/40 mt-2">
                                                    <div className="flex w-full gap-1.5 items-center text-xs text-muted-foreground truncate">
                                                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{nextTopic.title}</span>
                                                    </div>
                                                </CardFooter>
                                            )}
                                        </Card>
                                    )

                                    if (!nextTopic) {
                                        return <div key={item.id}>{scheduleCard}</div>
                                    }

                                    return (
                                        <DialogDemo
                                            key={item.id}
                                            variant="label"
                                            title={nextTopic.title}
                                            description="Detalhes do tópico atual"
                                            contentBtn={scheduleCard}
                                        >
                                            <div className="space-y-4 min-w-0">
                                                <div>
                                                    <span className="text-sm font-semibold">Matéria: </span>
                                                    <span className="text-sm">{nextTopic.subject.title}</span>
                                                </div>

                                                <div>
                                                    <span className="text-sm font-semibold flex items-center gap-1 mb-2">
                                                        <Paperclip className="h-4 w-4" /> Anexos:
                                                    </span>

                                                    {!hasAttachments ? (
                                                        <p className="text-sm text-muted-foreground">Sem anexos para este tópico.</p>
                                                    ) : (
                                                        <div className="flex flex-col gap-2 min-w-0">
                                                            {nextTopic.attachments!.map((attachment) => (
                                                                <div key={attachment.id} className="flex w-full min-w-0 gap-2 items-center text-sm">
                                                                    <FileText
                                                                        className="h-4 w-4 shrink-0"
                                                                        style={{ color: nextTopic.subject.color }}
                                                                    />
                                                                    <span className="min-w-0 flex-1 truncate">
                                                                        {attachment.name}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </DialogDemo>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )
                })}
            </section>
        </main>
    )

    // return (
    //     <main>
    //         <header className="space-y-1">
    //             <h1 className="bg-card py-2 px-2 text-xl font-bold shadow-sm">
    //                 Cronograma
    //             </h1>
    //             <div className="flex justify-between p-2 items-center">
    //                 <p className="text-sm font-medium text-muted-foreground">
    //                     Gerencie seu cronograma.
    //                 </p>
    //                 <DialogDemo
    //                     contentBtn={
    //                         <span className="flex items-center gap-2">
    //                             <Plus className="h-4 w-4" />
    //                             <span>Adicionar Matéria</span>
    //                         </span>
    //                     }
    //                     title="Adicionar Matéria"
    //                     description="Adicione uma materia ao cronograma"
    //                 >
    //                     <FieldGroup >
    //                         <Field>
    //                             <Label>Dia da semana:</Label>
    //                             <Select items={week_days}>
    //                                 <SelectTrigger>
    //                                     <SelectValue />
    //                                 </SelectTrigger>
    //                                 <SelectContent>
    //                                     <SelectGroup>
    //                                         <SelectLabel>Dias da Semana</SelectLabel>
    //                                         {week_days.map((day) => (
    //                                             <SelectItem key={day.value} value={day.value}>
    //                                                 {day.label}
    //                                             </SelectItem>
    //                                         ))}
    //                                     </SelectGroup>
    //                                 </SelectContent>
    //                             </Select>
    //                         </Field>
    //                         <Field>
    //                             <Label>Matéria:</Label>
    //                             <Select items={week_days}>
    //                                 <SelectTrigger>
    //                                     <SelectValue />
    //                                 </SelectTrigger>
    //                                 <SelectContent>
    //                                     <SelectGroup>
    //                                         <SelectLabel>Dias da Semana</SelectLabel>
    //                                         {week_days.map((day) => (
    //                                             <SelectItem key={day.value} value={day.value}>
    //                                                 {day.label}
    //                                             </SelectItem>
    //                                         ))}
    //                                     </SelectGroup>
    //                                 </SelectContent>
    //                             </Select>
    //                         </Field>
    //                         <Field className="grid grid-cols-2">
    //                             <div className="flex flex-col gap-2">
    //                                 <Label>Início:</Label>
    //                                 <Input type="time" step={0} />
    //                             </div>
    //                             <div className="flex flex-col gap-2">
    //                                 <Label>Fim:</Label>
    //                                 <Input type="time" step={0} />
    //                             </div>
    //                         </Field>
    //                     </FieldGroup>
    //                 </DialogDemo>
    //             </div>

    //             {/* Barra de ferramentas e navegação */}
    //             <nav aria-label="Ações das anotações" className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
    //                 <div className="flex items-center gap-2 w-full sm:w-auto">

    //                 </div>
    //             </nav>
    //         </header>
    //         <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-2 gap-3">
    //             {week_days.slice(1).map((day) => (
    //                 <Card key={day.label} className={`max-h-150 overflow-y-auto ${currentDay.toLowerCase() === day.label.toLowerCase() ? "border border-primary/50 shadow-sm shadow-primary/50" : ""}`}>
    //                     <CardHeader>
    //                         <CardTitle className="truncate">{day.label}</CardTitle>
    //                         <CardAction>
    //                             <DialogDemo
    //                                 contentBtn={
    //                                     <span className="flex items-center gap-1"><Plus size={38} />Adicionar</span>
    //                                 }
    //                                 title="Adicionar Matéria"
    //                                 description="Adicione uma matéria a este dia da semana"
    //                             >
    //                                 <FieldGroup>
    //                                     <Field>
    //                                         <Label>Matéria:</Label>
    //                                         <Select items={week_days}>
    //                                             <SelectTrigger>
    //                                                 <SelectValue />
    //                                             </SelectTrigger>
    //                                             <SelectContent>
    //                                                 <SelectGroup>
    //                                                     <SelectLabel>Dias da Semana</SelectLabel>
    //                                                     {week_days.map((day) => (
    //                                                         <SelectItem key={day.value} value={day.value}>
    //                                                             {day.label}
    //                                                         </SelectItem>
    //                                                     ))}
    //                                                 </SelectGroup>
    //                                             </SelectContent>
    //                                         </Select>
    //                                     </Field>
    //                                     <Field className="grid grid-cols-2">
    //                                         <div className="flex flex-col gap-2">
    //                                             <Label>Início:</Label>
    //                                             <Input type="time" step={0} />
    //                                         </div>
    //                                         <div className="flex flex-col gap-2">
    //                                             <Label>Fim:</Label>
    //                                             <Input type="time" step={0} />
    //                                         </div>
    //                                     </Field>
    //                                 </FieldGroup>
    //                             </DialogDemo>
    //                         </CardAction>
    //                     </CardHeader>
    //                     <CardContent className="flex flex-col space-y-3 pb-4">
    //                         {timeline
    //                             .filter((dayTimeline) => dayTimeline.day === day.label)
    //                             .map((item) => {
    //                                 const nextTopic = topics.find(
    //                                     (topic) =>
    //                                         topic.subject.id === item.subject?.id &&
    //                                         topic.status !== "CONCLUIDO"
    //                                 )

    //                                 const scheduleCard = (
    //                                     <Card>
    //                                         <CardHeader className="flex items-center justify-between">
    //                                             <CardTitle className="flex flex-col gap-1 truncate">
    //                                                 <div className="flex gap-2 items-center">
    //                                                     <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.subject?.color }} aria-hidden="true"></span>
    //                                                     <span className="truncate">{item.subject?.title}</span>
    //                                                 </div>
    //                                                 <div className="text-sm opacity-50">{item.start_time} - {item.end_time}</div>
    //                                             </CardTitle>
    //                                             <CardAction className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
    //                                                 <DialogDemo contentBtn={<PencilIcon />}>
    //                                                     <FieldGroup>
    //                                                         <Field>
    //                                                             <Label>Matéria:</Label>
    //                                                             <Select items={week_days}>
    //                                                                 <SelectTrigger>
    //                                                                     <SelectValue />
    //                                                                 </SelectTrigger>
    //                                                                 <SelectContent>
    //                                                                     <SelectGroup>
    //                                                                         <SelectLabel>Dias da Semana</SelectLabel>
    //                                                                         {week_days.map((day) => (
    //                                                                             <SelectItem key={day.value} value={day.value}>
    //                                                                                 {day.label}
    //                                                                             </SelectItem>
    //                                                                         ))}
    //                                                                     </SelectGroup>
    //                                                                 </SelectContent>
    //                                                             </Select>
    //                                                         </Field>
    //                                                         <Field className="grid grid-cols-2">
    //                                                             <div className="flex flex-col gap-2">
    //                                                                 <Label>Início:</Label>
    //                                                                 <Input type="time" step={0} />
    //                                                             </div>
    //                                                             <div className="flex flex-col gap-2">
    //                                                                 <Label>Fim:</Label>
    //                                                                 <Input type="time" step={0} />
    //                                                             </div>
    //                                                         </Field>
    //                                                     </FieldGroup>
    //                                                 </DialogDemo>
    //                                                 <Button variant={"outline"}><Trash2 /></Button>
    //                                             </CardAction>
    //                                         </CardHeader>
    //                                         {nextTopic && (
    //                                             <CardFooter className="flex flex-col gap-1 items-start py-2">
    //                                                 <span className="flex w-full gap-1 items-center text-xs opacity-50 min-w-0">
    //                                                     <BookOpen size={15} className="shrink-0" />
    //                                                     <span className="min-w-0 truncate">{nextTopic.title}</span>
    //                                                 </span>
    //                                             </CardFooter>
    //                                         )}
    //                                     </Card>
    //                                 )

    //                                 return nextTopic ? (
    //                                     <DialogDemo key={item.id} variant="label" title={nextTopic?.title} description=" " contentBtn={scheduleCard}>
    //                                         <FieldGroup>
    //                                             <Label>
    //                                                 Matéria:
    //                                                 <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.subject?.color }} aria-hidden="true"></span>
    //                                                 {nextTopic?.subject.title}
    //                                             </Label>
    //                                             <Label>
    //                                                 <Paperclip size={15} />
    //                                                 Anexos:
    //                                             </Label>
    //                                             {!nextTopic?.attachments ? (
    //                                                 <p>Sem anexos...</p>
    //                                             ) : (
    //                                                 <div className="flex flex-row gap-1 truncate">
    //                                                     {nextTopic.attachments.map((attachments) => (
    //                                                         <div key={attachments.id} className="flex gap-1 items-center truncate">
    //                                                             <FileText color={nextTopic.subject.color} size={25} />
    //                                                             <span className="truncate">{attachments.name}</span>
    //                                                         </div>
    //                                                     ))}

    //                                                 </div>
    //                                             )}
    //                                         </FieldGroup>
    //                                     </DialogDemo>
    //                                 ) : (
    //                                     <div key={item.id}>{scheduleCard}</div>
    //                                 )
    //                             })}
    //                     </CardContent>
    //                 </Card>
    //             ))}
    //         </section>
    //     </main>
    // )
}
import { getSubjects } from "@/services/subjects.service"
import { getTimeline } from "@/services/timeline.service"
import { getTopics } from "@/services/topics.service"
import { AlertCircle } from "lucide-react"
import { DayCard } from "./components/day-card";
import { Topic } from "@/types/topic";

const WEEK_DAYS = [
    "Domingo", "Segunda", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
]

export default async function CronogramaPage() {
    const currentDayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date());

    let data = null;

    try {
        const [allTimelines, allTopics, allSubjects] = await Promise.all([
            getTimeline(),
            getTopics(),
            getSubjects()
        ]);
        data = { timelines: allTimelines, topics: allTopics, subjects: allSubjects };
    } catch (error) {
        console.error("Falha ao carregar os dados do cronograma:", error);
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

    const currentDate = new Date();
    const dayDates = WEEK_DAYS.map((day) => {
        const currentDayIndex = currentDate.getDay();
        const targetDayIndex = WEEK_DAYS.indexOf(day);
        const daysUntilTarget = (targetDayIndex - currentDayIndex + 7) % 7;
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() + daysUntilTarget);
        return { day, date: targetDate };
    });

    const pendingTopicsBySubject = data.topics.reduce((acc: Record<string, Topic>, topic: Topic) => {
        if (topic.status !== "CONCLUIDO" && topic.subject?.id && !acc[topic.subject.id]) {
            acc[topic.subject.id] = topic;
        }
        return acc;
    }, {});

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
                {WEEK_DAYS.map((dayLabel, index) => {
                    const isToday = currentDayName !== "" && currentDayName.toLowerCase() === dayLabel.toLowerCase();
                    const dayEvents = data.timelines.filter((t) => t.day === dayLabel) || [];
                    const dateObj = dayDates[index].date;

                    return (
                        <DayCard
                            key={dayLabel}
                            dayLabel={dayLabel}
                            date={dateObj}
                            isToday={isToday}
                            dayEvents={dayEvents}
                            pendingTopicsBySubject={pendingTopicsBySubject}
                            subjects={data.subjects}
                        />
                    )
                })}
            </section>
        </main>
    )
}

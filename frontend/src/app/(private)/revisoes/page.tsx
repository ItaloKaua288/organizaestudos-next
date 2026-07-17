"use client"

import { Clock, CheckCircle2 } from "lucide-react"
import { Topic } from "@/types/topic"
import { useEffect, useState } from "react"
import { ReviewSection } from "./components/reviewSection"
import { getTopics } from "@/services/topics.service"


function formatDate(isoString: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(isoString));
}

export default function RevisaoPage() {
    const [topics, setTopics] = useState<Topic[]>([])

    useEffect(() => {
        async function loadTopics() {
            const data = await getTopics();
            setTopics(data);
        }
        loadTopics();
    }, []);

    const topicTimes: Record<"day" | "week" | "month" | "concluded", Topic[]> = {
        day: topics.filter((topic) => !topic.reviews.first.concluded),
        week: topics.filter((topic) => !topic.reviews.second.concluded),
        month: topics.filter((topic) => !topic.reviews.third.concluded),
        concluded: topics.filter(
            (topic) =>
                topic.reviews.first.concluded &&
                topic.reviews.second.concluded &&
                topic.reviews.third.concluded
        ),
    }

    const sections = [
        {
            title: "24 horas",
            icon: <Clock size={20} />,
            topics: topicTimes["day"] || [],
        },
        {
            title: "7 dias",
            icon: <Clock size={20} />,
            topics: topicTimes["week"] || [],
        },
        {
            title: "30 dias",
            icon: <Clock size={20} />,
            topics: topicTimes["month"] || [],
        },
        {
            title: "Concluído",
            icon: <CheckCircle2 size={20} className="text-green-500" />,
            topics: topicTimes["concluded"] || [],
        },
    ];

    return (
        <div className="flex flex-col gap-4 min-h-screen pb-10">
            <header className="space-y-1">
                <h1 className="px-2 text-xl font-bold shadow-sm bg-card py-2">
                    Revisões
                </h1>
                <p className="font-medium px-2 text-sm text-muted-foreground">
                    Visualise suas revisões. Elas são espaçadas entre 24 horas, 7 dias e 30 dias.
                </p>
            </header>

            <div className="flex flex-col gap-3">
                {sections.map((sec, index) => (
                    <ReviewSection
                        key={index}
                        title={sec.title}
                        icon={sec.icon}
                        topics={sec.topics}
                    />
                ))}
            </div>
        </div>
    )
}
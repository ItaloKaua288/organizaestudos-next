"use client"

import { Clock, CheckCircle2 } from "lucide-react"
import { ApiResponse, Topic } from "@/types/topic"
import { useEffect, useState } from "react"

import { ReviewSection } from "./components/reviewSection"

const responseExemple = {
    "success": true,
    "subjects": [
        {
            "_id": "6a2ee4bf63fe8e34b7fa9ebb",
            "title": "Compreensão e interpretação de texto.",
            "status": "CONCLUIDO" as const,
            "matter_id": {
                "_id": "6a2ee3f863fe8e34b7fa9e68",
                "title": "Portugues",
                "user_id": "6a2ee3ee63fe8e34b7fa9e60",
                "color": "#ff6467",
                "createdAt": "2026-06-14T17:25:12.510Z",
                "updatedAt": "2026-06-14T17:25:12.510Z",
                "__v": 0
            },
            "order": 1,
            "review1": "2026-06-17T01:27:50.249Z",
            "review2": "2026-06-23T01:27:50.249Z",
            "review3": "2026-08-14T14:59:09.361Z",
            "review1_concluded": false,
            "review2_concluded": false,
            "review3_concluded": false,
            "link": null,
            "attachments": [{
                id: "1",
                name: "string",
                url: undefined,
                file: undefined,
            }],
            "createdAt": "2026-06-14T17:28:31.693Z",
            "updatedAt": "2026-07-15T14:59:09.361Z",
            "__v": 0
        },
        {
            "_id": "6a2ee4c363fe8e34b7fa9ebf",
            "title": " Significação das palavras: sinônimos, antônimos, homônimos e parônimos.",
            "status": "CONCLUIDO" as const,
            "matter_id": {
                "_id": "6a2ee3f863fe8e34b7fa9e68",
                "title": "Portugues",
                "user_id": "6a2ee3ee63fe8e34b7fa9e60",
                "color": "#ff6467",
                "createdAt": "2026-06-14T17:25:12.510Z",
                "updatedAt": "2026-06-14T17:25:12.510Z",
                "__v": 0
            },
            "order": 0,
            "review1": "2026-06-19T23:03:30.937Z",
            "review2": "2026-06-25T23:03:30.937Z",
            "review3": "2026-07-18T23:03:30.938Z",
            "review1_concluded": true,
            "review2_concluded": false,
            "review3_concluded": false,
            "link": null,
            "attachments": [],
            "createdAt": "2026-06-14T17:28:35.234Z",
            "updatedAt": "2026-07-15T02:31:32.710Z",
            "__v": 0
        }
    ]
}

async function getTopics(): Promise<Topic[]> {
    const res = await fetch("URL", { cache: "no-store" })

    // if (!res.ok)
    //     throw new Error("Failed to load topics")

    // const data: ApiResponse = await res.json();

    // if (!data.success || !Array.isArray(data.subjects))
    //     return [];

    const formattedTopics: Topic[] = responseExemple.subjects.map((item) => ({
        id: item._id,
        title: item.title,
        status: item.status,
        order: item.order,
        link: item.link,
        subject: {
            id: item.matter_id._id,
            title: item.matter_id.title,
            color: item.matter_id.color,
        },
        reviews: {
            first: { date: item.review1, concluded: item.review1_concluded },
            second: { date: item.review2, concluded: item.review2_concluded },
            third: { date: item.review3, concluded: item.review3_concluded },
        },
        attachments: item.attachments
    }))

    return formattedTopics.sort((a, b) => a.order - b.order)
}

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
import type { Topic } from "@/types/topic"
import { TopicsApiResponse } from "@/types/apiResponse"

export async function getTopics(): Promise<Topic[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}topics`, {
            credentials: "include",
            next: { revalidate: 3600 },
        })
        if (!res.ok) throw new Error("Falha ao buscar os tópicos")
        const data: TopicsApiResponse = await res.json()

        const formattedTopics: Topic[] = data.topics.map((item) => ({
            id: item._id,
            title: item.title,
            status: item.status,
            order: item.order,
            link: item.link,
            subject: {
                id: item.subject_id._id,
                title: item.subject_id.title,
                color: item.subject_id.color,
            },
            reviews: {
                first: { date: item.review1, concluded: item.review1_concluded },
                second: { date: item.review2, concluded: item.review2_concluded },
                third: { date: item.review3, concluded: item.review3_concluded },
            },
            attachments: item.attachments,
        }))

        return formattedTopics.sort((a, b) => a.order - b.order)
    } catch (error) {
        console.error("Erro ao buscar os tópicos", error)
        return []
    }
}
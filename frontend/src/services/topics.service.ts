import { mockOrganizaEstudosApi } from "@/mocks/organizaestudosapi.mock"
import type { Topic } from "@/types/topic"

export async function getTopics(): Promise<Topic[]> {
    try {
        // const res = await fetch("https://api.exemplo.com/topics", { next: {revalidate: 3600} })
        
        // if (!res.ok) throw new Error("Falha ao buscar os tópicos")
        // const data = await res.json()


        const formattedTopics: Topic[] = mockOrganizaEstudosApi.topics.subjects.map((item) => ({
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
    } catch (error) {
        console.error("Erro ao buscar os tópicos", error)
        return []
    }
}
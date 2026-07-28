import type { Topic, TopicStatus } from "@/types/topic"
import { TopicsApiResponse } from "@/types/apiResponse"

export async function getTopics(): Promise<Topic[]> {
    try {
        const res = await fetch(`/api/topics`, {
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

export async function createTopic(title: string, subject_id: string) {
    try {
        const res = await fetch("/api/topics", {
            next: { revalidate: 3600 },
            method: "POST",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify({title, subject_id})
        })

        if (!res.ok) throw new Error("Falha ao criar o assunto")
    } catch (error) {
        console.error("Falha ao criar o assunto", error)
        throw error
    }
}

export async function updateTopicStatus(topicId: string, status: TopicStatus) {
    try {
        const res = await fetch(`/api/topics/${topicId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Falha ao atualizar o status do tópico");
        }
        
        return await res.json();

    } catch (error) {
        console.error("Falha ao atualizar o status do tópico", error);
        throw error;
    }
}

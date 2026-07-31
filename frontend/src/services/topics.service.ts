"use server";

import { TopicsApiResponse } from "@/types/apiResponse";
import type { Topic, TopicStatus } from "@/types/topic";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://organizaestudos-api.vercel.app/api";

async function getAuthHeaders() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    return {
        "Content-Type": "application/json",
        ...(token ? { "Cookie": `token=${token}` } : {})
    };
}

export async function getTopics(): Promise<Topic[]> {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics`, {
            headers,
            next: { revalidate: 3600, tags: ["topics"] },
        });

        if (!res.ok) throw new Error("Falha ao buscar os tópicos");

        const data: TopicsApiResponse = await res.json();

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
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, subject_id })
        });

        if (!res.ok) throw new Error("Falha ao criar o assunto");

        revalidatePath("/materias")
    } catch (error) {
        console.error("Falha ao criar o assunto", error)
        throw error
    }
}

export async function updateTopicStatus(topicId: string, status: TopicStatus) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${topicId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Falha ao atualizar o status do tópico!");
        }

        revalidatePath("/materias")
        return await res.json();
    } catch (error) {
        console.error("Falha ao atualizar o status do tópico", error);
        throw error;
    }
}

export async function updateTopicReviewStatus(topicId: string, review: string, isCompleted: boolean) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${isCompleted ? "concluded-review" : "undo-review"}/${topicId}/${review}`, {
            method: "PUT",
            headers
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Falha ao atualizar o status da revisão!");
        }

        revalidatePath("/revisoes")
        return await res.json();
    } catch (error) {
        console.error("Falha ao atualizar o status da revisão", error);
        throw error;
    }
}

export async function updateTopic(topicId: string, title: string, link: string, review1: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${topicId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, link, review1 })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Falha ao atualizar o assunto!");
        }

        revalidatePath("/materias")
        return await res.json();
    } catch (error) {
        console.error("Falha ao atualizar o assunto", error);
        throw error;
    }
}

export async function deleteTopic(topicId: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${topicId}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Falha ao deletar o assunto!");
        }

        revalidatePath("/materias")
        return await res.json();
    } catch (error) {
        console.error("Falha ao deletar o assunto", error);
        throw error;
    }
}
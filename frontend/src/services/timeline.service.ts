"use server";

import { TimelineApiResponse } from "@/types/apiResponse";
import type { Timeline } from "@/types/timeline";
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

export async function getTimeline(): Promise<Timeline[]> {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines`, {
            headers,
            next: { revalidate: 3600 },
        })

        if (!res.ok) throw new Error("Falha ao buscar a timeline")

        const data: TimelineApiResponse = await res.json()

        return data.timeline.map((item) => ({
            id: item._id,
            day: item.day,
            start_time: item.startTime,
            end_time: item.endTime,
            subject: {
                id: item.subject_id._id,
                title: item.subject_id.title,
                color: item.subject_id.color,
            },
        }))
    } catch (error) {
        console.error("Erro ao buscar a timeline", error)
        return []
    }
}

export async function createTimeline(timeline: { day: string, subject_id: string, startTime: string, endTime: string }): Promise<void> {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines`, {
            headers,
            method: "POST",
            body: JSON.stringify(timeline)
        })

        if (!res.ok) throw new Error("Falha ao criar a timeline")
        revalidatePath("/cronograma")
    } catch (error) {
        console.error("Erro ao criar a timeline", error)
        throw error
    }
}

export async function deleteTimeline(timelineId: string): Promise<void> {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/timelines/${timelineId}`, {
            headers,
            method: "DELETE"
        })

        if (!res.ok) throw new Error("Falha ao excluir a timeline")
        revalidatePath("/cronograma")
    } catch (error) {
        console.error("Erro ao excluir a timeline", error)
    }
}

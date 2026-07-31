"use server";

import { TimelineApiResponse } from "@/types/apiResponse";
import type { Timeline } from "@/types/timeline";
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
import { TimelineApiResponse } from "@/types/apiResponse"
import type { Timeline } from "@/types/timeline"

export async function getTimeline(): Promise<Timeline[]> {
    try {
        const res = await fetch(`/api/timelines`, {
            credentials: "include",
            next: { revalidate: 3600 },
        })

        if (!res.ok) throw new Error("Falha ao buscar a timeline")

        const data: TimelineApiResponse = await res.json()

        const formattedTimeline: Timeline[] = data.timeline.map((item) => ({
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

        return formattedTimeline
    } catch (error) {
        console.error("Erro ao buscar a timeline", error)
        return []
    }
}
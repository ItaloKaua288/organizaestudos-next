import { mockOrganizaEstudosApi } from "@/mocks/organizaestudosapi.mock"
import type { Timeline } from "@/types/topic"

export async function getTimeline(): Promise<Timeline[]> {
    try {
        // const res = await fetch("https://api.exemplo.com/timeline", { next: {revalidate: 3600} })

        // if (!res.ok) throw new Error("Falha ao buscar a timeline")
        // const data = await res.json()


        const formattedTimeline: Timeline[] = mockOrganizaEstudosApi.timeline.timeline.map((item) => ({
            id: item._id,
            day: item.day,
            start_time: item.startTime,
            end_time: item.endTime,
            subject: {
                id: item.matter_id._id,
                title: item.matter_id.title,
                color: item.matter_id.color
            },
        }))

        return formattedTimeline
    } catch (error) {
        console.error("Erro ao buscar a timeline", error)
        return []
    }
}
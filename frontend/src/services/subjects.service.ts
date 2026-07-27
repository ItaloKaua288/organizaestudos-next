import type { Subject } from "@/types/subject"
import { ApiSubjectResponse } from "@/types/apiResponse"

export async function getSubjects(): Promise<Subject[]> {
    try {
        const res = await fetch(`/api/subjects`, {
            next: { revalidate: 3600 },
        })

        if (!res.ok) throw new Error("Falha ao buscar as matérias")

        const data: ApiSubjectResponse = await res.json()

        const formattedSubjects: Subject[] = data.subjects.map((item) => ({
            id: item._id,
            title: item.title,
            color: item.color,
        }))

        return formattedSubjects
    } catch (error) {
        console.error("Erro ao buscar as matérias", error)
        return []
    }
}
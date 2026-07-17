import { mockOrganizaEstudosApi } from "@/mocks/organizaestudosapi.mock"
import type { Subject } from "@/types/topic"

export async function getSubjects(): Promise<Subject[]> {
    try {
        // const res = await fetch("https://api.exemplo.com/subjects", { next: {revalidate: 3600} })
        
        // if (!res.ok) throw new Error("Falha ao buscar as matérias")
        // const data = await res.json()


        const formattedSubjects: Subject[] = mockOrganizaEstudosApi.subjects.matters.map((item) => ({
            id: item._id,
            title: item.title,
            color: item.color
        }))

        return formattedSubjects
    } catch (error) {
        console.error("Erro ao buscar as matérias", error)
        return []
    }
}
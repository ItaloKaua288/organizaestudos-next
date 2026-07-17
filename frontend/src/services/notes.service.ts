import { mockOrganizaEstudosApi } from "@/mocks/organizaestudosapi.mock"
import type { Note } from "@/types/topic"

export async function getNotes(): Promise<Note[]> {
    try {
        // const res = await fetch("https://api.exemplo.com/note", { next: {revalidate: 3600} })

        // if (!res.ok) throw new Error("Falha ao buscar as anotações")
        // const data = await res.json()


        const formattedNotes: Note[] = mockOrganizaEstudosApi.notes.notes.map((item) => ({
            id: item._id,
            title: item.title,
            content: item.content,
            is_pined: item.isPinned,
            subject: {
                id: item.matter_id._id,
                title: item.matter_id.title,
                color: item.matter_id.color
            },
        }))

        return formattedNotes
    } catch (error) {
        console.error("Erro ao buscar as anotações", error)
        return []
    }
}
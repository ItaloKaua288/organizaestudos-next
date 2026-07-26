import { NoteApiResponse } from "@/types/apiResponse"
import type { Note } from "@/types/note"

export async function getNotes(id:string): Promise<Note[]> {
    try {
        const res = await fetch(`/api/notes/${id}`, {
            credentials: "include",
            next: { revalidate: 3600 },
        })

        if (!res.ok) throw new Error("Falha ao buscar as anotações")

        const data: NoteApiResponse = await res.json()

        const formattedNotes: Note[] = data.notes.map((item) => ({
            id: item._id,
            title: item.title,
            content: item.content,
            is_pined: item.isPinned,
            subject: {
                id: item.subject_id._id,
                title: item.subject_id.title,
                color: item.subject_id.color
            },
        }))

        return formattedNotes
    } catch (error) {
        console.error("Erro ao buscar as anotações", error)
        return []
    }
}
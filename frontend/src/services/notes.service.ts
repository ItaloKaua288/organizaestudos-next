import { NoteApiResponse } from "@/types/apiResponse";
import type { Note } from "@/types/note";
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

export async function getNotes(id: string): Promise<Note[]> {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${id}`, {
            headers,
            next: { revalidate: 3600 },
        })

        if (!res.ok) throw new Error("Falha ao buscar as anotações")

        const data: NoteApiResponse = await res.json()

        return data.notes.map((item) => ({
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
    } catch (error) {
        console.error("Erro ao buscar as anotações", error)
        return []
    }
}

export async function createNote(title: string, content: string, subject_id: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, content, subject_id })
        });

        if (!res.ok) throw new Error("Falha ao criar anotação")

        revalidatePath(`/notas/${subject_id}`)
    } catch (error) {
        console.error("Falha ao criar anotação", error)
        throw error
    }
}

export async function deleteNote(noteId: string, subject_id: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) throw new Error("Falha ao criar anotação")

        revalidatePath(`/notas/${subject_id}`)
    } catch (error) {
        console.error("Falha ao criar anotação", error)
        throw error
    }
}

export async function updateNote(noteId: string, title: string, content: string, subject_id: string, isPinned: boolean) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/notes/${noteId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, content, subject_id, isPinned })
        });

        if (!res.ok) throw new Error("Falha ao atualizar anotação")

        revalidatePath(`/notas/${subject_id}`)
    } catch (error) {
        console.error("Falha ao atualizar anotação", error)
        throw error
    }
}
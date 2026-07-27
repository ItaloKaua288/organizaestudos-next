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

export async function createSubject(title:string, color:string) {
    try {
        const res = await fetch("/api/subjects", {
            next: { revalidate: 3600 },
            method: "POST",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify({title, color})
        })

        if (!res.ok) throw new Error("Falha ao criar matéria")
    } catch (error) {
        console.error("Falha ao criar matéria", error)
    }
}

export async function updateSubject(title: string, color: string, subject_id: string) {
    try {
        const res = await fetch(`/api/subjects/${subject_id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify({title, color})
        })

        if (!res.ok) throw new Error("Falha ao atualizar a matéria")
    } catch (error) {
        console.error("Falha ao atualizar a matéria", error)
        throw error
    }
}

export async function deleteSubject(subject_id: string) {
    try {
        const res = await fetch(`/api/subjects/${subject_id}`, {
            method: "DELETE",
            headers: {"Content-Type": "application/json",},
        })

        if (!res.ok) throw new Error("Falha ao deletar a matéria")
    } catch (error) {
        console.error("Falha ao deletar a matéria", error)
        throw error
    }
}
"use server";

import { fixEncoding } from "@/lib/text";
import { ApiDetailSubjectResponse, ApiSubjectResponse } from "@/types/apiResponse";
import { Note } from "@/types/note";
import type { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
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

export async function getSubjects(): Promise<Subject[]> {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects`, {
            headers,
            cache: "force-cache",
        })

        if (!res.ok) throw new Error("Falha ao buscar as matérias")

        const data: ApiSubjectResponse = await res.json()

        return data.subjects.map((item) => ({
            id: item._id,
            title: item.title,
            color: item.color,
        }))
    } catch (error) {
        console.error("Erro ao buscar as matérias", error)
        return []
    }
}

export async function getDetailSubject(subject_id: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects/${subject_id}`, {
            headers,
            cache: "force-cache",
        })

        if (!res.ok) throw new Error("Falha ao buscar as matérias")

        const data: ApiDetailSubjectResponse = await res.json()

        const subjectInfo = {
            id: data.subject._id,
            title: data.subject.title,
            color: data.subject.color,
        };

        const formattedData: Subject = {
            ...subjectInfo,

            topics: data.topics.map((topic): Topic => ({
                id: topic._id,
                title: topic.title,
                status: topic.status,
                order: topic.order,

                subject: subjectInfo,

                reviews: {
                    first: {
                        date: topic.review1,
                        concluded: topic.review1_concluded,
                    },
                    second: {
                        date: topic.review2,
                        concluded: topic.review2_concluded,
                    },
                    third: {
                        date: topic.review3,
                        concluded: topic.review3_concluded,
                    },
                },

                link: topic.link,
                attachments: topic.attachments.map((attach) => ({
                    id: attach._id!,
                    name: fixEncoding(attach.name),
                    url: attach.url,
                    file: attach.file,
                    public_id: attach.public_id,
                })),
            })),

            notes: data.notes.map((note): Note => ({
                id: note._id,
                title: note.title,
                content: note.content,
                is_pined: note.isPinned,

                subject: subjectInfo,
            })),
        };

        return formattedData
    } catch (error) {
        console.error("Erro ao buscar as matérias", error)
    }
}

export async function createSubject(title: string, color: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, color })
        });

        revalidatePath("/materias")
        if (!res.ok) throw new Error("Falha ao criar matéria")
    } catch (error) {
        console.error("Falha ao criar matéria", error)
        throw error
    }
}

export async function updateSubject(title: string, color: string, subject_id: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects/${subject_id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, color })
        });

        revalidatePath("/materias")
        revalidatePath("/notas")
        revalidatePath("/")
        revalidatePath("/cronograma")
        revalidatePath("/revisoes")
        if (!res.ok) throw new Error("Falha ao atualizar a matéria");
    } catch (error) {
        console.error("Falha ao atualizar a matéria", error)
        throw error
    }
}

export async function deleteSubject(subject_id: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects/${subject_id}`, {
            method: "DELETE",
            headers,
        });

        revalidatePath("/materias")
        if (!res.ok) throw new Error("Falha ao deletar a matéria");
    } catch (error) {
        console.error("Falha ao deletar a matéria", error)
        throw error
    }
}
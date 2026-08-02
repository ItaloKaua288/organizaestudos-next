"use server";

import { ApiSubjectResponse } from "@/types/apiResponse";
import type { Subject } from "@/types/subject";
import { revalidateTag } from "next/cache";
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
            next: { tags: ["subjects"] },
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

export async function createSubject(title: string, color: string) {
    try {
        const baseUrl = getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/subjects`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, color })
        });

        if (!res.ok) throw new Error("Falha ao criar matéria")

        revalidateTag("subjects", "hours");
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

        if (!res.ok) throw new Error("Falha ao atualizar a matéria");

        revalidateTag("subjects", "hours");
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

        if (!res.ok) throw new Error("Falha ao deletar a matéria");

        revalidateTag("subjects", "hours");
    } catch (error) {
        console.error("Falha ao deletar a matéria", error)
        throw error
    }
}
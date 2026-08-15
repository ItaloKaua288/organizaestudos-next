"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { fixEncoding } from "@/lib/text";
import { TopicsApiResponse } from "@/types/apiResponse";
import { Topic } from "@/types/topic";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function getTopicsAction(): Promise<Topic[]> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics`, {
            headers,
            cache: "force-cache",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha ao buscar os assuntos na API.");
        }

        const data: TopicsApiResponse = await res.json();

        return data.topics.map((topic) => ({
            id: topic._id,
            title: topic.title,
            status: topic.status,
            order: topic.order,
            link: topic.link,
            subject: {
                id: topic.subject_id._id,
                title: topic.subject_id.title,
                color: topic.subject_id.color,
            },
            reviews: {
                first: { date: topic.review1, concluded: topic.review1_concluded },
                second: { date: topic.review2, concluded: topic.review2_concluded },
                third: { date: topic.review3, concluded: topic.review3_concluded },
            },
            attachments: topic.attachments.map(attachment => ({
                ...attachment,
                name: fixEncoding(attachment.name),
            })),
        }))
    } catch (error) {
        console.error("Erro interno ao buscar as anotações:", error);
        throw new Error("Não foi possível carregar as anotações. Tente novamente mais tarde.");
    }
}

const deleteAttachSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório."),
    public_id: z.string().min(1, "O public_id do anexo é obrigatório."),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!")
})

export async function deleteAttachAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteAttachSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação ao deletar:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos para deleção." };
        }

        const { topicId, public_id, subject_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/attachment/${topicId}`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ public_id }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao deletar anexo." };
        }

        revalidatePath("/materias")
        revalidatePath(`/materias/${subject_id}`)

        return { success: true, message: "Anexo deletado com sucesso!" }
    } catch (error) {
        console.error("Erro ao deletar anexo:", error);
        return { success: false, message: "Erro ao deletar anexo." }
    }
}

const createTopicSchema = z.object({
    title: z.string().min(1, "O Título é obrigatório"),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!")
})

export async function createTopicAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = createTopicSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { title, subject_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, subject_id })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao criar assunto." };
        }

        const subjectId = (await res.json()).topic.subject_id

        revalidatePath("/materias")
        revalidatePath(`/materias/${subjectId}`)

        return { success: true, message: "Assunto criado com sucesso!" }
    } catch (error) {
        console.error("Erro ao criar assunto:", error);
        return { success: false, message: "Erro ao criar assunto." }
    }
}

const updateTopicSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório!"),
    title: z.string().min(1, "O título é obrigatório"),
    link: z.string(),
    review1: z.string(),
    status: z.preprocess(
        (value) => value === "null" ? null : value,
        z.enum(["CONCLUIDO", "PENDENTE"]).nullable()
    )
})

export async function updateTopicAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = updateTopicSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { topicId, title, link, review1, status } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        let res;

        if (status) {
            res = await fetch(`${baseUrl}/topics/${topicId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ status })
            });
        } else {
            res = await fetch(`${baseUrl}/topics/${topicId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ title, link: link && link.trim() !== "" ? link : null, review1 })
            });
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao atualizar assunto." };
        }

        const subjectId = (await res.json()).topic.subject_id

        revalidatePath("/materias")
        revalidatePath(`/materias/${subjectId}`)

        return { success: true, message: "Assunto atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao atualizar assunto:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const updateTopicStatusSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório!"),
    title: z.string().min(1, "O título é obrigatório"),
    link: z.string(),
    review1: z.string(),
})

export async function updateTopicStatusAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = updateTopicStatusSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { topicId, title, link, review1 } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${topicId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ title, link: link && link.trim() !== "" ? link : null, review1 })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao atualizar assunto." };
        }

        const subjectId = (await res.json()).topic.subject_id

        revalidatePath("/materias")
        revalidatePath(`/materias/${subjectId}`)

        return { success: true, message: "Assunto atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao atualizar assunto:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const deleteTopicSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório!"),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!")
})

export async function deleteTopicAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteTopicSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { topicId, subject_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${topicId}`, {
            method: "DELETE",
            headers
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao deletar assunto." };
        }

        revalidatePath("/materias")
        revalidatePath(`/materias/${subject_id}`)

        return { success: true, message: "Assunto deletado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao deletar assunto:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const sendAttachPDFSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório!"),
    file: z
        .file()
        .refine(
            (file) => file.size <= 5242880, // 5MB
            "O arquivo deve ter no máximo 5 MB!"
        )
        .refine(
            (file) => file.type === "application/pdf",
            "O arquivo deve ser um PDF!"
        ),
    // file: z.file().min(1, "É necessário enviar pelo menos 1 arquivo!"),
})

export async function sendattachmentPDFAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = sendAttachPDFSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { topicId } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { "Content-Type": _, ...headersUpload } = headers;

        const res = await fetch(`${baseUrl}/topics/attachment/${topicId}`, {
            method: "POST",
            headers: headersUpload,
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao enviar anexo." };
        }

        const subjectId = (await res.json()).topic.subject_id

        revalidatePath("/materias")
        revalidatePath(`/materias/${subjectId}`)

        return { success: true, message: "Anexo enviado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao enviar anexo:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const openTopicAttachmentSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório."),
    public_id: z.string().min(1, "O public_id do anexo é obrigatório.")
})

export async function openTopicAttachmentAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = openTopicAttachmentSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário.", blob: null };
        }

        const { topicId, public_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/stream-pdf/${topicId}/${encodeURIComponent(public_id)}`, {
            headers,
            cache: "no-store",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao abrir anexo.", blob: null };
        }

        return { success: true, message: "Ocorreu um erro inesperado.", blob: await res.blob() };
    } catch (error) {
        console.error("Erro interno ao abrir anexo:", error);
        return { success: false, message: "Ocorreu um erro inesperado.", blob: null };
    }
}

const deleteAttachmentPDFSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório."),
    public_id: z.string().min(1, "O public_id do anexo é obrigatório.")
})

export async function deleteAttachmentPDFAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = deleteAttachmentPDFSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { topicId, public_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/attachment/${topicId}`, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ public_id }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao deletar anexo." };
        }

        const subjectId = (await res.json()).topic.subject_id

        revalidatePath("/materias")

        revalidatePath(`/materias/${subjectId}`)

        return { success: true, message: "Anexo deletado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao abrir anexo:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const updateTopicReviewStatusSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório."),
    review: z.string().min(1, "A revisão é obrigatório."),
    isCompleted: z.preprocess(
        (value) => value == "true" ? true : false,
        z.boolean()
    ),
})

export async function updateTopicReviewStatusAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = updateTopicReviewStatusSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { topicId, review, isCompleted } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${isCompleted ? "concluded-review" : "undo-review"}/${topicId}/${review}`, {
            method: "PUT",
            headers
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao atualizar status da revisão." };
        }

        const subjectId = (await res.json()).topic.subject_id

        revalidatePath("/")
        revalidatePath("/revisoes")
        revalidatePath("/materias")
        revalidatePath(`/materias/${subjectId}`)

        return { success: true, message: "Status da revisão atualizado com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao atualizar status da revisão:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}
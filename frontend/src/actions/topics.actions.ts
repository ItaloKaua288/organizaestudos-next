"use server";

import { getAuthHeaders, getBaseUrl } from "@/lib/api.utils";
import { fixEncoding } from "@/lib/text";
import { markContainers, sortTopicsHierarchically, TOPIC_TITLE_SEPARATOR, withoutContainers } from "@/lib/topic-tree";
import { TopicsApiResponse } from "@/types/apiResponse";
import { Topic, TopicStatus } from "@/types/topic";
import { revalidatePath, updateTag } from "next/cache";
import z from "zod";

/** Tag do cache dos assuntos: toda tela que lê `getTopicsAction` depende dela. */
const TOPICS_CACHE_TAG = "topics";

/**
 * Atualiza tudo que depende dos assuntos: lista de matérias, página de detalhes da matéria e também
 * cronograma, ciclo de estudos, dashboard e revisões (é lá que o anexo/assunto aparece no diálogo
 * "Sem assunto pendente" / detalhe do assunto).
 * A API devolve `topic.subject_id` populado (objeto) em várias rotas; por isso o id é extraído com cuidado
 * e a página dinâmica `/materias/[id]` também é revalidada, para nunca ficar com dados antigos em cache.
 */
function revalidateSubjectPages(subject?: unknown) {
    const subjectId = typeof subject === "string"
        ? subject
        : (subject as { _id?: unknown } | null | undefined)?._id;

    // Expira o cache de dados (fetch) usado por getTopicsAction, em qualquer tela.
    updateTag(TOPICS_CACHE_TAG);

    revalidatePath("/materias");
    revalidatePath("/materias/[id]", "page");
    revalidatePath("/cronograma");
    revalidatePath("/kanban");
    revalidatePath("/revisoes");
    revalidatePath("/");

    if (subjectId) revalidatePath(`/materias/${String(subjectId)}`);
}

/**
 * Lista todos os assuntos (inclusive subassuntos), cada subassunto logo após o pai.
 * Por padrão o título do subassunto vem como "Assunto › Subassunto" (para revisões, cronograma
 * e dashboard fazerem sentido). A tela de matérias usa { rawTitles: true } para editar o título real.
 *
 * Assuntos que têm subassuntos são apenas organizadores: por padrão eles NÃO vêm na lista (assim não
 * entram em revisões, cronograma, dashboard nem no progresso). A tela de matérias usa
 * { includeContainers: true } para mostrá-los.
 */
export async function getTopicsAction(options?: { rawTitles?: boolean; includeContainers?: boolean }): Promise<Topic[]> {
    try {
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics`, {
            headers,
            cache: "force-cache",
            next: { tags: [TOPICS_CACHE_TAG] },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Falha ao buscar os assuntos na API.");
        }

        const data: TopicsApiResponse = await res.json();

        const titleById = new Map(data.topics.map((topic) => [topic._id, topic.title]));

        const topics: Topic[] = data.topics.map((topic) => {
            const parentId = topic.parent_id && titleById.has(topic.parent_id) ? topic.parent_id : null;
            const parentTitle = parentId ? titleById.get(parentId) ?? null : null;

            return {
                id: topic._id,
                title: parentTitle && !options?.rawTitles ? `${parentTitle}${TOPIC_TITLE_SEPARATOR}${topic.title}` : topic.title,
                status: topic.status,
                order: topic.order,
                parentId,
                parentTitle,
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
            };
        });

        // Ordena a árvore COMPLETA (com os organizadores) e só depois remove os organizadores.
        // Se removesse antes, os subassuntos perderiam o pai na lista, virariam "raízes" e seriam
        // ordenados pelo `order` relativo aos irmãos (0, 1, 2...), passando na frente dos assuntos
        // sem subassuntos e impedindo que estes apareçam como próximo assunto.
        const sorted = sortTopicsHierarchically(markContainers(topics));

        return options?.includeContainers ? sorted : withoutContainers(sorted);
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

        revalidateSubjectPages(subject_id)

        return { success: true, message: "Anexo deletado com sucesso!" }
    } catch (error) {
        console.error("Erro ao deletar anexo:", error);
        return { success: false, message: "Erro ao deletar anexo." }
    }
}

const createTopicSchema = z.object({
    title: z.string().min(1, "O Título é obrigatório"),
    subject_id: z.string().min(1, "O ID da matéria é obrigatório!"),
    // Quando informado, o novo item é um subassunto deste assunto.
    parent_id: z.string().optional()
})

export async function createTopicAction(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        const validatedData = createTopicSchema.safeParse(rawData);

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos enviados no formulário." };
        }

        const { title, subject_id, parent_id } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics`, {
            method: "POST",
            headers,
            body: JSON.stringify({ title, subject_id, parent_id: parent_id || null })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao criar assunto." };
        }

        const subjectId = (await res.json()).topic?.subject_id

        revalidateSubjectPages(subjectId)

        return { success: true, message: parent_id ? "Subassunto criado com sucesso!" : "Assunto criado com sucesso!" }
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
        z.enum(["CONCLUIDO", "ESTUDANDO", "PENDENTE"]).nullable()
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

        const subjectId = (await res.json()).topic?.subject_id

        revalidateSubjectPages(subjectId)

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

        const subjectId = (await res.json()).topic?.subject_id

        revalidateSubjectPages(subjectId)

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

        revalidateSubjectPages(subject_id)

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

        const subjectId = (await res.json()).topic?.subject_id

        revalidateSubjectPages(subjectId)

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

        revalidateSubjectPages()

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
    // Avaliação opcional ao concluir (revisões inteligentes). Vazio = calendário padrão.
    performance: z.preprocess(
        (value) => (value === "" || value === undefined ? undefined : value),
        z.enum(["ERROU", "DIFICIL", "BOM", "FACIL"]).optional()
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

        const { topicId, review, isCompleted, performance } = validatedData.data;
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${isCompleted ? "concluded-review" : "undo-review"}/${topicId}/${review}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(isCompleted && performance ? { performance } : {})
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao atualizar status da revisão." };
        }

        const responseData = await res.json();
        const subjectId = responseData.topic?.subject_id
        const nextReview = responseData.nextReview
            ? { date: String(responseData.nextReview.date), days: Number(responseData.nextReview.days) }
            : undefined;

        revalidatePath("/")
        revalidatePath("/revisoes")
        revalidateSubjectPages(subjectId)

        return { success: true, message: "Status da revisão atualizado com sucesso!", nextReview };
    } catch (error) {
        console.error("Erro interno ao atualizar status da revisão:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

export async function reorderTopicsAction(subjectId: string, orderedTopicIds: string[]) {
    try {
        if (!subjectId || !Array.isArray(orderedTopicIds) || orderedTopicIds.length === 0) {
            return { success: false, message: "Dados inválidos para reordenar." };
        }

        const updates = orderedTopicIds.map((id, order) => ({ _id: id, order }));
        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/reorder-topics`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ updates })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao reordenar assuntos." };
        }

        revalidateSubjectPages(subjectId)

        return { success: true, message: "Ordem atualizada com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao reordenar assuntos:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

const moveTopicStatusSchema = z.object({
    topicId: z.string().min(1, "O ID do assunto é obrigatório!"),
    status: z.enum(["PENDENTE", "ESTUDANDO", "CONCLUIDO"]),
});

/**
 * Muda só o status do assunto (usado pelo Kanban).
 * A API cuida das revisões: CONCLUIDO agenda 1, 7 e 30 dias; qualquer outro status apaga as datas
 * e o progresso das revisões.
 */
export async function moveTopicStatusAction(topicId: string, status: TopicStatus) {
    try {
        const validatedData = moveTopicStatusSchema.safeParse({ topicId, status });

        if (!validatedData.success) {
            console.error("Erro de validação:", z.flattenError(validatedData.error));
            return { success: false, message: "Dados inválidos para mover o assunto." };
        }

        const baseUrl = await getBaseUrl();
        const headers = await getAuthHeaders();

        const res = await fetch(`${baseUrl}/topics/${validatedData.data.topicId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: validatedData.data.status })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return { success: false, message: errorData.message || "Falha da API ao mover o assunto." };
        }

        const subjectId = (await res.json()).topic?.subject_id;

        revalidateSubjectPages(subjectId);

        return { success: true, message: "Assunto movido com sucesso!" };
    } catch (error) {
        console.error("Erro interno ao mover assunto:", error);
        return { success: false, message: "Ocorreu um erro inesperado." };
    }
}

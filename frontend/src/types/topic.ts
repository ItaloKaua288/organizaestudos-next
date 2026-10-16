import { Attachment } from "./apiResponse";
import { Subject } from "./subject";


/** PENDENTE = a estudar · ESTUDANDO = em andamento · CONCLUIDO = estudado (entra no ciclo de revisões). */
export type TopicStatus = 'PENDENTE' | 'ESTUDANDO' | 'CONCLUIDO';

export interface Topic {
    id: string;
    title: string;
    status: TopicStatus;
    subject: Subject;
    order: number;
    /** Id do assunto pai quando este item é um subassunto (apenas 1 nível). null = assunto principal. */
    parentId?: string | null;
    /** Título do assunto pai (só para exibição). */
    parentTitle?: string | null;
    /**
     * true quando o assunto tem subassuntos: ele vira apenas um organizador (sem status, revisões,
     * anexos, link ou questões próprias) e o progresso vem dos subassuntos.
     */
    isContainer?: boolean;
    /** Quantidade de subassuntos (só quando isContainer). */
    subtopicsTotal?: number;
    /** Quantidade de subassuntos concluídos (só quando isContainer). */
    subtopicsDone?: number;
    reviews: {
        first: { date: string; concluded: boolean };
        second: { date: string; concluded: boolean };
        third: { date: string; concluded: boolean };
    };
    link: string | null;
    attachments: Attachment[];
}


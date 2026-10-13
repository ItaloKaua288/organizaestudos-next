import { Attachment } from "./apiResponse";
import { Subject } from "./subject";


export type TopicStatus = 'PENDENTE' | 'CONCLUIDO';

export interface Topic {
    id: string;
    title: string;
    status: 'CONCLUIDO' | 'PENDENTE';
    subject: Subject;
    order: number;
    /** Id do assunto pai quando este item é um subassunto (apenas 1 nível). null = assunto principal. */
    parentId?: string | null;
    /** Título do assunto pai (só para exibição). */
    parentTitle?: string | null;
    reviews: {
        first: { date: string; concluded: boolean };
        second: { date: string; concluded: boolean };
        third: { date: string; concluded: boolean };
    };
    link: string | null;
    attachments: Attachment[];
}


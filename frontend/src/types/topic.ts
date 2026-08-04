import { Attachment } from "./apiResponse";
import { Subject } from "./subject";


export type TopicStatus = 'PENDENTE' | 'CONCLUIDO';

export interface Topic {
    id: string;
    title: string;
    status: 'CONCLUIDO' | 'PENDENTE';
    subject: Subject;
    order: number;
    reviews: {
        first: { date: string; concluded: boolean };
        second: { date: string; concluded: boolean };
        third: { date: string; concluded: boolean };
    };
    link: string | null;
    attachments: Attachment[];
}


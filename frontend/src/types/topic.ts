// ==========================================
// 1. API TYPES (External input)
// ==========================================
interface ApiMatter {
    _id: string;
    title: string;
    user_id: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface ApiSubjectItem {
    _id: string;
    title: string;
    status: 'CONCLUIDO' | 'PENDENTE';
    matter_id: ApiMatter;
    order: number;
    review1: string;
    review2: string;
    review3: string;
    review1_concluded: boolean;
    review2_concluded: boolean;
    review3_concluded: boolean;
    link: string | null;
    attachments: unknown[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface ApiResponse {
    success: boolean;
    subjects: ApiSubjectItem[];
}

// ==========================================
// 2. APPLICATION TYPES
// ==========================================

export interface Subject {
    id: string;
    title: string;
    color: string;
}

export type Attachment = {
    id: string;
    name: string;
    url?: string;
    file?: File;
};

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
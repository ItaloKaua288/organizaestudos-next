export interface ApiSubject {
    _id: string;
    title: string;
    user_id: string;
    color: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface ApiSubjectResponse {
    success: boolean;
    subjects: ApiSubject[];
}

export interface ApiDetailSubjectResponse {
    success: boolean;
    subject: ApiSubject;
    topics: ApiTopic[];
    notes: ApiNote[];
}

export type Attachment = {
    id: string;
    _id?: string,
    name: string;
    url?: string;
    file?: File;
    public_id?: string;
};

interface ApiTopic {
    _id: string
    title: string
    status: "PENDENTE" | "CONCLUIDO"
    subject_id: ApiSubject
    order: number
    review1: string
    review2: string
    review3: string
    review1_concluded: boolean
    review2_concluded: boolean
    review3_concluded: boolean
    link: string | null
    attachments: Attachment[]
}

export interface TopicsApiResponse {
    success: boolean
    topics: ApiTopic[]
}

export interface ApiTimeline {
    _id: string
    subject_id: ApiSubject
    day: string,
    startTime: string
    endTime: string
}

export interface TimelineApiResponse {
    success: boolean
    timeline: ApiTimeline[]
}

export interface ApiNote {
    _id: string
    title: string
    content: string
    isPinned: boolean
    subject_id: ApiSubject
}

export interface NoteApiResponse {
    success: boolean
    notes: ApiNote[]
}
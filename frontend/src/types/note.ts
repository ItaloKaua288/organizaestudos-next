import { Subject } from "./subject";

export interface NoteAttachment {
    id: string;
    name: string;
    url: string;
    public_id: string;
    mimeType: string;
    size: number;
}

/** Nota (de qualquer matéria) que menciona a nota atual. */
export interface NoteBacklink {
    id: string;
    title: string;
    subjectId: string;
}

/** Destino possível de um link dentro do editor. */
export interface NoteLinkTarget {
    id: string;
    title: string;
    subjectId: string;
    subjectTitle: string;
    subjectColor: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    is_pined: boolean;
    subject: Subject;
    tags?: string[];
    attachments?: NoteAttachment[];
    backlinks?: NoteBacklink[];
    created_at?: string;
    updated_at?: string;
}

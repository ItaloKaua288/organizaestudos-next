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

/** Resumo das notas de uma matéria (página de Anotações). */
export interface NoteSubjectSummary {
    subjectId: string;
    count: number;
    pinned: number;
    attachments: number;
    /** Data da última edição (ISO). */
    lastUpdatedAt: string | null;
}

/** Nota recente (de qualquer matéria), com uma prévia do texto. */
export interface RecentNote {
    id: string;
    title: string;
    preview: string;
    subjectId: string;
    isPinned: boolean;
    updatedAt: string;
}

export interface NotesOverview {
    subjects: NoteSubjectSummary[];
    recent: RecentNote[];
}

export interface NoteSearchResult {
    id: string;
    title: string;
    /** Trecho do texto (sem HTML) perto do termo buscado. */
    snippet: string;
    subjectId: string;
    isPinned: boolean;
    tags: string[];
    updatedAt: string;
}

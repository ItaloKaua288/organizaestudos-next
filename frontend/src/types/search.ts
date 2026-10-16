export interface SearchSubjectResult {
    id: string;
    title: string;
    color: string;
}

export interface SearchTopicResult {
    id: string;
    title: string;
    status: "CONCLUIDO" | "ESTUDANDO" | "PENDENTE";
    isSubtopic: boolean;
    subjectId: string;
    subjectTitle: string;
    subjectColor: string;
}

export interface SearchNoteResult {
    id: string;
    title: string;
    /** Trecho do texto da nota (já sem HTML) perto do termo buscado. */
    snippet: string;
    subjectId: string;
    subjectTitle: string;
    subjectColor: string;
}

export interface SearchResults {
    query: string;
    subjects: SearchSubjectResult[];
    topics: SearchTopicResult[];
    notes: SearchNoteResult[];
}

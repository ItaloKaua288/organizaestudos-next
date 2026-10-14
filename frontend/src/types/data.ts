export interface ImportSummary {
    subjectsCreated: number;
    /** Matérias que já existiam (mesmo título) e receberam os assuntos novos. */
    subjectsMerged: number;
    /** Matérias desativadas: não recebem assuntos novos. */
    subjectsSkipped: number;
    topicsCreated: number;
    /** Assuntos e subassuntos que já existiam e foram ignorados. */
    topicsSkipped: number;
}

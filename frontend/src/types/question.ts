/** Questões feitas/acertadas em um assunto, enviadas ao concluir uma sessão. */
export interface QuestionEntryInput {
    topic_id: string;
    total: number;
    correct: number;
}

export interface QuestionTopicStat {
    id: string;
    title: string;
    total: number;
    correct: number;
    wrong: number;
    /** % de acerto (0 a 100, uma casa decimal). 0 quando ainda não há questões. */
    percent: number;
    sessions: number;
    lastAnsweredAt: string | null;
}

export interface QuestionSubjectStat {
    id: string;
    title: string;
    color: string;
    total: number;
    correct: number;
    wrong: number;
    percent: number;
    topics: QuestionTopicStat[];
}

export interface QuestionRecentLog {
    id: string;
    subjectId: string;
    subjectTitle: string;
    subjectColor: string;
    topicId: string;
    topicTitle: string;
    total: number;
    correct: number;
    percent: number;
    answeredAt: string;
}

/** Questões e acertos somados em uma semana (segunda a domingo). */
export interface QuestionTrendPoint {
    weekStart: string;
    total: number;
    correct: number;
    percent: number;
}

export interface QuestionStats {
    overall: { total: number; correct: number; wrong: number; percent: number };
    subjects: QuestionSubjectStat[];
    /** Evolução semanal das últimas 12 semanas (só semanas com questões), da mais antiga para a mais nova. */
    trend: QuestionTrendPoint[];
    recent: QuestionRecentLog[];
}

/** Assunto selecionável no registro de questões. */
export interface QuestionTopicOption {
    id: string;
    title: string;
}

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

/** Questões e acertos somados em um dia (fuso de São Paulo). `date` vem como AAAA-MM-DD. */
export interface QuestionDailyPoint {
    date: string;
    total: number;
    correct: number;
    percent: number;
}

/** Questões e acertos somados em uma hora de hoje (0 a 23, fuso de São Paulo). */
export interface QuestionHourlyPoint {
    hour: number;
    total: number;
    correct: number;
    percent: number;
}

export interface QuestionStats {
    overall: { total: number; correct: number; wrong: number; percent: number };
    subjects: QuestionSubjectStat[];
    /** Evolução semanal das últimas 12 semanas (só semanas com questões), da mais antiga para a mais nova. */
    trend: QuestionTrendPoint[];
    /** Dia de hoje em São Paulo (AAAA-MM-DD). Âncora dos filtros do gráfico. */
    today: string;
    /** Evolução diária (só dias com questões), do mais antigo para o mais novo. */
    daily: QuestionDailyPoint[];
    /** Hoje, hora a hora (só horas com questões). */
    hourly: QuestionHourlyPoint[];
    recent: QuestionRecentLog[];
}

/** Assunto selecionável no registro de questões. */
export interface QuestionTopicOption {
    id: string;
    title: string;
}

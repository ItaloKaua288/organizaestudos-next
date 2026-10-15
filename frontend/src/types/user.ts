export interface AccountStats {
    /** Quantidade de perfis de estudo. */
    profiles: number;
    subjects: number;
    activeSubjects: number;
    topics: number;
    concludedTopics: number;
    notes: number;
    questionsTotal: number;
    questionsCorrect: number;
}

export interface Account {
    name: string;
    createdAt: string;
    lastLogin: string | null;
    stats: AccountStats;
}

export interface UserActionResult {
    success: boolean;
    message: string;
    name?: string;
}

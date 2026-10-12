export type CycleSessionStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "PULADA";

export interface CycleSession {
    id: string;
    subject: { id: string; title: string; color: string };
    /** Duração planejada em minutos. */
    duration: number;
    status: CycleSessionStatus;
    startedAt: string | null;
    /** Matéria desativada ou removida: fica fora do percentual e é ignorada ao avançar. */
    inactive: boolean;
    removed: boolean;
}

export interface CycleHistoryItem {
    id: string;
    subjectTitle: string;
    subjectColor: string;
    lap: number;
    duration: number;
    status: "CONCLUIDA" | "PULADA";
    finishedAt: string;
}

export interface Cycle {
    id: string;
    /** Volta atual (começa em 1). */
    lap: number;
    /** Quantas sessões formam um "dia" na lista (0 = sem divisão por dia). */
    sessionsPerDay: number;
    /** Sessões concluídas desde a criação do ciclo. */
    totalCompleted: number;
    /** Posição atual no ciclo. Null quando não há sessões utilizáveis. */
    currentSessionId: string | null;
    sessions: CycleSession[];
    /** Progresso calculado apenas com a volta atual. */
    progress: { completed: number; skipped: number; total: number; percent: number };
    history: CycleHistoryItem[];
}

export interface CycleSessionInput {
    id?: string;
    subject_id: string;
    duration: number;
}

export interface CycleActionResult {
    success: boolean;
    message: string;
    cycle?: Cycle | null;
    /** A sessão já havia sido atualizada (clique duplicado/outra aba). */
    stale?: boolean;
}

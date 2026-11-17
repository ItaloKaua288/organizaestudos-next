export type CycleSessionStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "PULADA";

/** Id "virtual" da sessão de revisão (ela não tem matéria): é o `subject.id` e o valor enviado ao salvar o ciclo. */
export const REVIEW_SUBJECT_ID = "__revisao__";

/** MATERIA = estuda uma matéria · REVISAO = mostra as revisões do dia. */
export type CycleSessionKind = "MATERIA" | "REVISAO";

export interface CycleSession {
    id: string;
    /** Sessões antigas podem vir sem `kind` (= MATERIA). */
    kind?: CycleSessionKind;
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
    /** Nome do ciclo (ex.: "Ciclo pré-edital"). */
    name: string;
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

/** Resumo de um ciclo do perfil, usado no seletor de ciclos. */
export interface CycleSummary {
    id: string;
    name: string;
    sessionsCount: number;
    lap: number;
}

export interface CyclesState {
    cycles: CycleSummary[];
    activeCycleId: string | null;
}

export interface CycleProfileActionResult {
    success: boolean;
    message: string;
    /** Ciclo que ficou ativo depois da ação (null = o perfil ficou sem ciclos). */
    cycle?: Cycle | null;
}

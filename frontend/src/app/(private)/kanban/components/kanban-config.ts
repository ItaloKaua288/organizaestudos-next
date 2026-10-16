import type { TopicStatus } from "@/types/topic";
import { BookOpen, CheckCheck, ListTodo, type LucideIcon } from "lucide-react";

export type KanbanColumnConfig = {
    status: TopicStatus;
    title: string;
    /** Linha curta sob o título, explica o que a coluna significa. */
    hint: string;
    /** Texto quando a coluna está vazia. */
    empty: string;
    icon: LucideIcon;
    /** Cores do ícone no cabeçalho da coluna. */
    tone: string;
    /** Cor do contorno quando um card está sobre a coluna. */
    dropTone: string;
};

/**
 * As três colunas do quadro, na ordem do fluxo de estudo.
 * Para renomear uma coluna, mude só o `title` (o `status` é o valor guardado na API).
 */
export const KANBAN_COLUMNS: readonly KanbanColumnConfig[] = [
    {
        status: "PENDENTE",
        title: "A estudar",
        hint: "Na fila",
        empty: "Nenhum assunto na fila.",
        icon: ListTodo,
        tone: "bg-foreground/8 text-muted-foreground",
        dropTone: "outline-foreground/40",
    },
    {
        status: "ESTUDANDO",
        title: "Estudando",
        hint: "Em andamento",
        empty: "Arraste um assunto para cá quando começar a estudá-lo.",
        icon: BookOpen,
        tone: "bg-primary/15 text-primary",
        dropTone: "outline-primary/70",
    },
    {
        status: "CONCLUIDO",
        title: "Concluído",
        hint: "Revisões em 1, 7 e 30 dias",
        empty: "Os assuntos concluídos entram no ciclo de revisões.",
        icon: CheckCheck,
        tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        dropTone: "outline-emerald-500/70",
    },
] as const;

export const KANBAN_STATUSES = new Set<string>(KANBAN_COLUMNS.map((column) => column.status));

export function getColumn(status: TopicStatus): KanbanColumnConfig {
    return KANBAN_COLUMNS.find((column) => column.status === status) ?? KANBAN_COLUMNS[0];
}

/** Quantos cards cada coluna mostra de início (o resto entra em "Mostrar mais"). */
export const COLUMN_PAGE_SIZE = 40;

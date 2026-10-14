"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { QuestionEntryInput, QuestionTopicOption } from "@/types/question";
import { Check, ChevronsUpDown, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

const MAX_QUESTIONS = 10000;

export type QuestionGroup = {
    id: string;
    title: string;
    color: string;
    topics: QuestionTopicOption[];
};

type Row = {
    key: string;
    topic_id: string;
    total: string;
    correct: string;
};

type QuestionLogDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    /** Matérias com seus assuntos. Com um único grupo, o nome da matéria não é repetido na lista. */
    groups: QuestionGroup[];
    /** Assunto já selecionado na primeira linha. */
    defaultTopicId?: string;
    /** true = exige ao menos uma linha preenchida; false = linhas vazias são ignoradas. */
    required?: boolean;
    submitLabel: string;
    /** Quando informado, mostra um botão que segue sem registrar questões. */
    skipLabel?: string;
    isBusy?: boolean;
    onSubmit: (entries: QuestionEntryInput[]) => void;
    onSkip?: () => void;
};

let rowCounter = 0;
const newRow = (topic_id = ""): Row => ({ key: `question-row-${++rowCounter}`, topic_id, total: "", correct: "" });

const isEmptyRow = (row: Row) => row.topic_id === "" && row.total.trim() === "" && row.correct.trim() === "";

export function QuestionLogDialog(props: QuestionLogDialogProps) {
    const { open, onOpenChange } = props;

    // O formulário é reiniciado a cada abertura (o componente interno é remontado).
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && <QuestionLogForm {...props} onClose={() => onOpenChange(false)} />}
        </Dialog>
    );
}

function QuestionLogForm({
    title,
    description,
    groups,
    defaultTopicId,
    required = false,
    submitLabel,
    skipLabel,
    isBusy = false,
    onSubmit,
    onSkip,
    onClose,
}: Omit<QuestionLogDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
    const allTopics = groups.flatMap((group) => group.topics);
    const initialTopic = defaultTopicId && allTopics.some((t) => t.id === defaultTopicId) ? defaultTopicId : "";
    const [rows, setRows] = useState<Row[]>(() => [newRow(initialTopic)]);

    const updateRow = (key: string, patch: Partial<Row>) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const removeRow = (key: string) => setRows((prev) => (prev.length === 1 ? [newRow()] : prev.filter((r) => r.key !== key)));

    const addRow = () => setRows((prev) => [...prev, newRow()]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isBusy) return;

        const entries: QuestionEntryInput[] = [];

        for (const row of rows) {
            if (isEmptyRow(row)) continue;

            const total = Number(row.total);
            const correct = Number(row.correct);

            if (!row.topic_id) {
                toast.error("Selecione o assunto de todas as linhas.");
                return;
            }
            if (row.total.trim() === "" || !Number.isInteger(total) || total < 1 || total > MAX_QUESTIONS) {
                toast.error(`Questões feitas deve ser um número de 1 a ${MAX_QUESTIONS}.`);
                return;
            }
            if (row.correct.trim() === "" || !Number.isInteger(correct) || correct < 0) {
                toast.error("Informe quantas questões você acertou (0 ou mais).");
                return;
            }
            if (correct > total) {
                toast.error("Os acertos não podem ser maiores que as questões feitas.");
                return;
            }

            entries.push({ topic_id: row.topic_id, total, correct });
        }

        if (required && entries.length === 0) {
            toast.error("Informe o assunto e quantas questões você fez e acertou.");
            return;
        }

        onSubmit(entries);
    };

    return (
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
            <form onSubmit={handleSubmit} className="min-w-0">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-4 flex flex-col gap-3 max-h-[50dvh] overflow-y-auto overscroll-contain pr-1">
                    {allTopics.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Esta matéria ainda não tem assuntos cadastrados. Cadastre um assunto para registrar questões.
                        </p>
                    )}

                    {rows.map((row) => {
                        const total = Number(row.total);
                        const correct = Number(row.correct);
                        const showPercent =
                            row.total.trim() !== "" && row.correct.trim() !== "" &&
                            Number.isInteger(total) && Number.isInteger(correct) &&
                            total > 0 && correct >= 0 && correct <= total;

                        return (
                            <div key={row.key} className="flex min-w-0 flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center">
                                <TopicPicker
                                    value={row.topic_id}
                                    onChange={(topic_id) => updateRow(row.key, { topic_id })}
                                    groups={groups}
                                    disabled={isBusy || allTopics.length === 0}
                                />

                                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                    <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center">
                                        Feitas
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={1}
                                            max={MAX_QUESTIONS}
                                            value={row.total}
                                            onChange={(e) => updateRow(row.key, { total: e.target.value })}
                                            className="h-10 w-full text-center text-base text-foreground sm:h-8 sm:w-20 sm:text-sm"
                                            disabled={isBusy}
                                        />
                                    </label>
                                    <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center">
                                        Acertos
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            max={MAX_QUESTIONS}
                                            value={row.correct}
                                            onChange={(e) => updateRow(row.key, { correct: e.target.value })}
                                            className="h-10 w-full text-center text-base text-foreground sm:h-8 sm:w-20 sm:text-sm"
                                            disabled={isBusy}
                                        />
                                    </label>
                                    <div className="col-span-2 flex items-center justify-between sm:contents">
                                        <span className="shrink-0 text-xs font-semibold tabular-nums sm:w-12 sm:text-right">
                                            {showPercent ? `${Math.round((correct / total) * 100)}%` : ""}
                                        </span>
                                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(row.key)} disabled={isBusy} aria-label="Remover linha">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div>
                        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={isBusy || allTopics.length === 0}>
                            <Plus className="h-4 w-4" /> Adicionar outro assunto
                        </Button>
                    </div>
                </div>

                <DialogFooter className="sm:items-center sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>Cancelar</Button>
                    {skipLabel && (
                        <Button type="button" variant="ghost" onClick={onSkip} disabled={isBusy}>{skipLabel}</Button>
                    )}
                    <Button type="submit" disabled={isBusy}>{submitLabel}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Mostra a busca só quando a lista é grande o bastante para precisar dela. */
const SEARCH_THRESHOLD = 7;

type TopicPickerProps = {
    value: string;
    onChange: (topicId: string) => void;
    groups: QuestionGroup[];
    disabled?: boolean;
};

/**
 * Seletor de assunto com busca, agrupado por matéria.
 * Busca por assunto ou matéria (sem diferenciar acentos/maiúsculas) e permite
 * filtrar por matéria. Enter escolhe o primeiro resultado.
 */
function TopicPicker({ value, onChange, groups, disabled = false }: TopicPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [subjectId, setSubjectId] = useState<string | null>(null);

    const groupsWithTopics = useMemo(() => groups.filter((group) => group.topics.length > 0), [groups]);
    const totalTopics = useMemo(() => groupsWithTopics.reduce((sum, group) => sum + group.topics.length, 0), [groupsWithTopics]);
    const showSearch = totalTopics >= SEARCH_THRESHOLD;
    const showSubjectChips = groupsWithTopics.length > 1;
    const showGroupLabels = groupsWithTopics.length > 1;

    const selected = useMemo(() => {
        for (const group of groupsWithTopics) {
            const topic = group.topics.find((t) => t.id === value);
            if (topic) return { topic, group };
        }
        return null;
    }, [groupsWithTopics, value]);

    const filtered = useMemo(() => {
        const q = normalize(query);
        return groupsWithTopics
            .filter((group) => subjectId === null || group.id === subjectId)
            .map((group) => {
                const subjectMatches = q !== "" && normalize(group.title).includes(q);
                const topics = q === "" || subjectMatches
                    ? group.topics
                    : group.topics.filter((topic) => normalize(topic.title).includes(q));
                return { ...group, topics };
            })
            .filter((group) => group.topics.length > 0);
    }, [groupsWithTopics, query, subjectId]);

    const resultCount = filtered.reduce((sum, group) => sum + group.topics.length, 0);

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setQuery("");
            setSubjectId(null);
        }
    };

    const pick = (topicId: string) => {
        onChange(topicId);
        handleOpenChange(false);
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                type="button"
                disabled={disabled}
                aria-label="Assunto"
                className={cn(
                    "flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none transition-colors sm:h-8 sm:flex-1",
                    "hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    "disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
                )}
            >
                {selected ? (
                    <>
                        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.group.color }} />
                        <span className="flex min-w-0 flex-1 flex-col leading-tight">
                            <span className="truncate">{selected.topic.title}</span>
                            {showGroupLabels && (
                                <span className="truncate text-[11px] text-muted-foreground">{selected.group.title}</span>
                            )}
                        </span>
                    </>
                ) : (
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">Selecione o assunto</span>
                )}
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>

            <PopoverContent align="start" className="w-(--anchor-width) min-w-64 gap-0 p-0">
                {showSearch && (
                    <div className="flex items-center gap-2 border-b px-2.5">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                // O popover é renderizado em portal, mas o Enter ainda chegaria ao <form> do diálogo.
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const first = filtered[0]?.topics[0];
                                    if (first) pick(first.id);
                                }
                            }}
                            placeholder="Buscar assunto ou matéria..."
                            aria-label="Buscar assunto"
                            className="h-10 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
                        />
                    </div>
                )}

                {showSubjectChips && (
                    <div className="rounded mt-1 mx-2 flex gap-1.5 overflow-x-auto border px-2.5 py-2 [scrollbar-width:none]">
                        <button
                            type="button"
                            onClick={() => setSubjectId(null)}
                            className={cn(
                                "shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                                subjectId === null ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                            )}
                        >
                            Todas
                        </button>
                        {groupsWithTopics.map((group) => (
                            <button
                                key={group.id}
                                type="button"
                                onClick={() => setSubjectId(subjectId === group.id ? null : group.id)}
                                className={cn(
                                    "flex max-w-48 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                                    subjectId === group.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                                )}
                            >
                                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                                <span className="truncate">{group.title}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div role="listbox" aria-label="Assuntos" className="max-h-[40dvh] overflow-y-auto overscroll-contain p-1">
                    {filtered.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nenhum assunto encontrado.</p>
                    ) : (
                        filtered.map((group) => (
                            <div key={group.id} role="group" aria-label={group.title}>
                                {showGroupLabels && (
                                    <div className="sticky top-0 z-10 flex items-center gap-2 bg-popover px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
                                        <span className="truncate">{group.title}</span>
                                        <span className="ml-auto tabular-nums">{group.topics.length}</span>
                                    </div>
                                )}
                                {group.topics.map((topic) => {
                                    const isSelected = topic.id === value;
                                    return (
                                        <button
                                            key={topic.id}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => pick(topic.id)}
                                            className={cn(
                                                "flex min-h-10 w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors sm:min-h-9",
                                                "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                                                isSelected && "bg-accent/60 font-medium",
                                            )}
                                        >
                                            <span className="min-w-0 flex-1 whitespace-normal break-words">{topic.title}</span>
                                            {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {showSearch && (
                    <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
                        {resultCount} de {totalTopics} assuntos
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

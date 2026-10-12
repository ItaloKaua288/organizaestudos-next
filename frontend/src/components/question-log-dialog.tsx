"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionEntryInput, QuestionTopicOption } from "@/types/question";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
        <DialogContent className="sm:max-w-xl">
            <form onSubmit={handleSubmit} className="min-w-0">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-4 flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
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
                            <div key={row.key} className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center">
                                <Select
                                    value={row.topic_id || null}
                                    onValueChange={(value) => updateRow(row.key, { topic_id: value ?? "" })}
                                    disabled={isBusy || allTopics.length === 0}
                                >
                                    <SelectTrigger className="w-full min-w-0 sm:flex-1" aria-label="Assunto">
                                        <SelectValue render={(value) => {
                                            const topic = allTopics.find((t) => t.id === value.children);
                                            return <span className="truncate">{topic?.title ?? "Selecione o assunto"}</span>;
                                        }} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.filter((group) => group.topics.length > 0).map((group) => (
                                            <SelectGroup key={group.id}>
                                                {groups.length > 1 && <SelectLabel>{group.title}</SelectLabel>}
                                                {group.topics.map((topic) => (
                                                    <SelectItem key={topic.id} value={topic.id}>
                                                        {topic.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                                        Feitas
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={1}
                                            max={MAX_QUESTIONS}
                                            value={row.total}
                                            onChange={(e) => updateRow(row.key, { total: e.target.value })}
                                            className="w-20 text-center text-foreground"
                                            disabled={isBusy}
                                        />
                                    </label>
                                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                                        Acertos
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            max={MAX_QUESTIONS}
                                            value={row.correct}
                                            onChange={(e) => updateRow(row.key, { correct: e.target.value })}
                                            className="w-20 text-center text-foreground"
                                            disabled={isBusy}
                                        />
                                    </label>
                                    <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums">
                                        {showPercent ? `${Math.round((correct / total) * 100)}%` : ""}
                                    </span>
                                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(row.key)} disabled={isBusy} aria-label="Remover linha">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
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

                <DialogFooter className="items-center sm:justify-end">
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

"use client"

import { saveCycleAction } from "@/actions/cycle.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cycle } from "@/types/cycle";
import { Subject } from "@/types/subject";
import { ArrowDown, ArrowUp, ListPlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatMinutes } from "./cycle-utils";

type Row = {
    key: string;
    id?: string;
    subject_id: string;
    duration: string;
};

type CycleEditorProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cycle: Cycle | null;
    subjects: Subject[];
    onSaved: (cycle: Cycle) => void;
};

const DEFAULT_DURATION = "60";
let rowCounter = 0;
const newKey = () => `row-${++rowCounter}`;

function buildRows(cycle: Cycle | null): Row[] {
    if (!cycle) return [{ key: newKey(), subject_id: "", duration: DEFAULT_DURATION }];

    // Sessões de matérias removidas não podem ser editadas: ficam de fora ao salvar.
    return cycle.sessions
        .filter((s) => !s.removed)
        .map((s) => ({ key: newKey(), id: s.id, subject_id: s.subject.id, duration: String(s.duration) }));
}

export function CycleEditor({ open, onOpenChange, cycle, subjects, onSaved }: CycleEditorProps) {
    // O formulário é reiniciado a cada abertura (o componente interno é remontado via key).
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {open && <CycleEditorForm cycle={cycle} subjects={subjects} onSaved={onSaved} onClose={() => onOpenChange(false)} />}
        </Dialog>
    );
}

function CycleEditorForm({ cycle, subjects, onSaved, onClose }: Omit<CycleEditorProps, "open" | "onOpenChange"> & { onClose: () => void }) {
    const [rows, setRows] = useState<Row[]>(() => buildRows(cycle));
    const [isSaving, setIsSaving] = useState(false);
    const [perDay, setPerDay] = useState(() => String(cycle?.sessionsPerDay ?? 0));

    // Matérias desativadas que já estão no ciclo continuam aparecendo para poderem ser trocadas/removidas.
    const options: Subject[] = [
        ...subjects,
        ...(cycle?.sessions ?? [])
            .filter((s) => !s.removed && !subjects.some((sub) => sub.id === s.subject.id))
            .map((s) => ({ id: s.subject.id, title: `${s.subject.title} (desativada)`, color: s.subject.color }))
            .filter((s, i, arr) => arr.findIndex((o) => o.id === s.id) === i),
    ];

    const updateRow = (key: string, patch: Partial<Row>) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

    const moveRow = (index: number, direction: -1 | 1) =>
        setRows((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;
            const copy = [...prev];
            [copy[index], copy[target]] = [copy[target], copy[index]];
            return copy;
        });

    const addRow = () => setRows((prev) => [...prev, { key: newKey(), subject_id: "", duration: DEFAULT_DURATION }]);

    const addAllSubjects = () =>
        setRows((prev) => {
            const used = new Set(prev.map((r) => r.subject_id));
            const missing = subjects.filter((s) => !used.has(s.id));
            if (missing.length === 0) return prev;
            const cleaned = prev.length === 1 && prev[0].subject_id === "" ? [] : prev;
            return [...cleaned, ...missing.map((s) => ({ key: newKey(), subject_id: s.id, duration: DEFAULT_DURATION }))];
        });

    const totalMinutes = rows.reduce((sum, r) => sum + (Number.parseInt(r.duration, 10) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        if (rows.length === 0) {
            toast.error("Adicione pelo menos uma sessão.");
            return;
        }

        const sessions = [];
        for (const row of rows) {
            const duration = Number(row.duration);
            if (!row.subject_id) {
                toast.error("Selecione a matéria de todas as sessões.");
                return;
            }
            if (!Number.isInteger(duration) || duration < 1 || duration > 720) {
                toast.error("A duração deve ser de 1 a 720 minutos.");
                return;
            }
            sessions.push({ id: row.id, subject_id: row.subject_id, duration });
        }

        const sessionsPerDay = Number(perDay === "" ? 0 : perDay);
        if (!Number.isInteger(sessionsPerDay) || sessionsPerDay < 0 || sessionsPerDay > 50) {
            toast.error("Matérias por dia deve ser um número inteiro de 0 a 50.");
            return;
        }

        setIsSaving(true);
        toast.loading("Salvando ciclo...", { id: "save-cycle" });
        try {
            const result = await saveCycleAction(sessions, sessionsPerDay);
            if (result.success && result.cycle) {
                toast.success(cycle ? "Ciclo atualizado!" : "Ciclo criado!", { id: "save-cycle" });
                onSaved(result.cycle);
                onClose();
            } else {
                toast.error(result.message, { id: "save-cycle" });
            }
        } catch {
            toast.error("Erro ao salvar o ciclo.", { id: "save-cycle" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-xl">
            <form onSubmit={handleSubmit} className="min-w-0">
                <DialogHeader>
                    <DialogTitle>{cycle ? "Editar ciclo de estudos" : "Criar ciclo de estudos"}</DialogTitle>
                    <DialogDescription>
                        Escolha as matérias e a duração de cada sessão. A ordem da lista é a ordem do ciclo.
                    </DialogDescription>
                </DialogHeader>

                <div className="pt-4 flex items-center gap-2">
                    <label htmlFor="sessions-per-day" className="text-sm font-medium">Matérias por dia</label>
                    <Input
                        id="sessions-per-day"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={50}
                        value={perDay}
                        onChange={(e) => setPerDay(e.target.value)}
                        className="w-16 text-center"
                        disabled={isSaving}
                    />
                    <span className="text-xs text-muted-foreground">0 = sem divisão por dia</span>
                </div>

                <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto py-4 pr-1">
                    {rows.map((row, index) => (
                        <div key={row.key} className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{index + 1}</span>

                            <Select
                                value={row.subject_id || null}
                                onValueChange={(value) => updateRow(row.key, { subject_id: value ?? "" })}
                            >
                                <SelectTrigger className="flex-1 min-w-0">
                                    <SelectValue render={(value) => {
                                        const subject = options.find((s) => s.id === value.children);
                                        return <span className="truncate">{subject?.title ?? "Selecione uma matéria"}</span>;
                                    }} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {options.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.title}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 shrink-0">
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={720}
                                    value={row.duration}
                                    onChange={(e) => updateRow(row.key, { duration: e.target.value })}
                                    className="w-16 text-center"
                                    aria-label="Duração em minutos"
                                    disabled={isSaving}
                                />
                                <span className="text-xs text-muted-foreground">min</span>
                            </div>

                            <div className="flex shrink-0">
                                <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveRow(index, -1)} disabled={index === 0 || isSaving} aria-label="Mover para cima">
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1 || isSaving} aria-label="Mover para baixo">
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(row.key)} disabled={isSaving} aria-label="Remover sessão">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {rows.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão no ciclo. Adicione uma matéria para começar.</p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={isSaving}>
                            <Plus className="h-4 w-4" /> Adicionar sessão
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addAllSubjects} disabled={isSaving || subjects.length === 0}>
                            <ListPlus className="h-4 w-4" /> Adicionar todas as matérias
                        </Button>
                    </div>
                </div>

                <DialogFooter className="items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">
                        {rows.length} {rows.length === 1 ? "sessão" : "sessões"} · {formatMinutes(totalMinutes)} por volta
                    </span>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar ciclo"}</Button>
                    </div>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

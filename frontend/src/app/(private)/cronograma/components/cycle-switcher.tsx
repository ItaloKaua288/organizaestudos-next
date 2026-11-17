"use client";

import {
    createCycleAction,
    deleteCycleByIdAction,
    getCyclesAction,
    renameCycleAction,
    switchCycleAction,
} from "@/actions/cycle.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Cycle, CycleSummary } from "@/types/cycle";
import { Check, ChevronsUpDown, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const TOAST_ID = "cycle-profile-action";

type CycleSwitcherProps = {
    /** Id do ciclo mostrado na tela (null = o perfil não tem ciclo). Quando muda, a lista é recarregada. */
    activeCycleId: string | null;
    /** Chamado quando outro ciclo passou a ser o ativo (troca, exclusão do ativo). null = nenhum ciclo restou. */
    onCycleChange: (cycle: Cycle | null) => void;
    /** Chamado quando um ciclo novo (vazio) foi criado, para a tela abrir o editor de sessões. */
    onCycleCreated: (cycle: Cycle) => void;
    disabled?: boolean;
};

/** Seletor de ciclos de estudo do perfil ativo, com criação, renomeação e exclusão (mesma lógica dos perfis de estudo). */
export function CycleSwitcher({ activeCycleId, onCycleChange, onCycleCreated, disabled = false }: CycleSwitcherProps) {
    const [cycles, setCycles] = useState<CycleSummary[]>([]);
    const [activeId, setActiveId] = useState<string | null>(activeCycleId);
    const [open, setOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        const state = await getCyclesAction();
        setCycles(state.cycles);
        setActiveId(state.activeCycleId);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load, activeCycleId]);

    const active = cycles.find((cycle) => cycle.id === activeId) ?? null;

    const resetEditing = () => {
        setEditingId(null);
        setEditingName("");
        setDeletingId(null);
    };

    const handleOpenChange = (next: boolean) => {
        if (isBusy) return;
        setOpen(next);
        if (next) load();
        else {
            resetEditing();
            setNewName("");
        }
    };

    const handleSwitch = async (cycleId: string) => {
        if (isBusy || cycleId === activeId) return;
        setIsBusy(true);
        toast.loading("Trocando de ciclo...", { id: TOAST_ID });

        try {
            const result = await switchCycleAction(cycleId);
            if (!result.success || !result.cycle) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setActiveId(cycleId);
            setOpen(false);
            onCycleChange(result.cycle);
        } catch {
            toast.error("Erro ao trocar de ciclo.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Criando ciclo...", { id: TOAST_ID });

        try {
            const result = await createCycleAction(newName);
            if (!result.success || !result.cycle) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setNewName("");
            setOpen(false);
            await load();
            onCycleCreated(result.cycle);
        } catch {
            toast.error("Erro ao criar o ciclo.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const handleRename = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isBusy || !editingId || !editingName.trim()) return;
        setIsBusy(true);
        toast.loading("Renomeando ciclo...", { id: TOAST_ID });

        try {
            const result = await renameCycleAction(editingId, editingName);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            const renamedId = editingId;
            resetEditing();
            await load();
            // Se o ciclo renomeado é o da tela, atualiza o nome mostrado nela.
            if (renamedId === activeId) {
                const fresh = await switchCycleAction(renamedId);
                if (fresh.success && fresh.cycle) onCycleChange(fresh.cycle);
            }
        } catch {
            toast.error("Erro ao renomear o ciclo.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const handleDelete = async (cycleId: string) => {
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Excluindo ciclo...", { id: TOAST_ID });

        try {
            const result = await deleteCycleByIdAction(cycleId);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            resetEditing();
            await load();
            // Excluir o ciclo que está na tela troca para o próximo (ou para o estado vazio).
            if (cycleId === activeId) onCycleChange(result.cycle ?? null);
        } catch {
            toast.error("Erro ao excluir o ciclo.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(true)}
                disabled={disabled}
                title={active ? `Ciclo: ${active.name}` : "Trocar de ciclo de estudos"}
                aria-label="Trocar de ciclo de estudos"
                className="max-w-64 gap-1.5"
            >
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span className="truncate">{active?.name ?? "Ciclos"}</span>
                {cycles.length > 1 && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{cycles.length}</span>}
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ciclos de estudo</DialogTitle>
                        <DialogDescription>
                            Tenha vários ciclos neste perfil e troque entre eles quando quiser. Cada ciclo guarda a própria ordem,
                            volta, progresso e histórico.
                        </DialogDescription>
                    </DialogHeader>

                    <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                        {cycles.length === 0 && (
                            <li className="px-1 py-2 text-sm text-muted-foreground">Nenhum ciclo neste perfil ainda. Crie o primeiro abaixo.</li>
                        )}
                        {cycles.map((cycle) => {
                            const isActive = cycle.id === activeId;
                            const isEditing = editingId === cycle.id;
                            const isDeleting = deletingId === cycle.id;

                            if (isEditing) {
                                return (
                                    <li key={cycle.id}>
                                        <form onSubmit={handleRename} className="flex items-center gap-1.5">
                                            <Input
                                                autoFocus
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                maxLength={60}
                                                aria-label="Novo nome do ciclo"
                                                disabled={isBusy}
                                            />
                                            <Button type="submit" size="icon" disabled={isBusy || !editingName.trim()} title="Salvar nome">
                                                <Check size={15} />
                                            </Button>
                                            <Button type="button" size="icon" variant="outline" onClick={resetEditing} disabled={isBusy} title="Cancelar">
                                                <X size={15} />
                                            </Button>
                                        </form>
                                    </li>
                                );
                            }

                            if (isDeleting) {
                                return (
                                    <li key={cycle.id} className="space-y-2 rounded-md border border-destructive/50 p-2 text-sm">
                                        <p>
                                            Excluir <strong>{cycle.name}</strong>? O ciclo e todo o histórico dele serão apagados.
                                            Não dá para desfazer.
                                        </p>
                                        <div className="flex justify-end gap-1.5">
                                            <Button type="button" size="sm" variant="outline" onClick={() => setDeletingId(null)} disabled={isBusy}>
                                                Cancelar
                                            </Button>
                                            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(cycle.id)} disabled={isBusy}>
                                                Excluir ciclo
                                            </Button>
                                        </div>
                                    </li>
                                );
                            }

                            return (
                                <li
                                    key={cycle.id}
                                    className={`flex items-center gap-1.5 rounded-md border p-1 ${isActive ? "border-primary bg-primary/5" : ""}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSwitch(cycle.id)}
                                        disabled={isBusy}
                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-muted disabled:opacity-60"
                                    >
                                        {isActive ? <Check size={15} className="shrink-0 text-primary" /> : <span className="w-[15px] shrink-0" />}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{cycle.name}</span>
                                            <span className="block text-xs text-muted-foreground">
                                                {cycle.sessionsCount === 0
                                                    ? "Sem sessões ainda"
                                                    : `${cycle.sessionsCount} ${cycle.sessionsCount === 1 ? "sessão" : "sessões"} · volta ${cycle.lap}`}
                                            </span>
                                        </span>
                                    </button>

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={isBusy}
                                        onClick={() => { setDeletingId(null); setEditingId(cycle.id); setEditingName(cycle.name); }}
                                        title="Renomear ciclo"
                                    >
                                        <Pencil size={14} />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={isBusy}
                                        onClick={() => { setEditingId(null); setDeletingId(cycle.id); }}
                                        title="Excluir ciclo"
                                    >
                                        <Trash2 size={14} className="text-destructive" />
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>

                    <form onSubmit={handleCreate} className="space-y-2 border-t pt-3">
                        <h3 className="text-sm font-semibold">Novo ciclo</h3>
                        <div className="flex items-center gap-1.5">
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex.: Reta final (opcional)"
                                maxLength={60}
                                aria-label="Nome do novo ciclo"
                                disabled={isBusy}
                            />
                            <Button type="submit" disabled={isBusy}>
                                <Plus size={15} /> Criar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

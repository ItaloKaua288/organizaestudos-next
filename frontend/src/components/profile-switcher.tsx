"use client";

import {
    createProfileAction,
    deleteProfileAction,
    getProfilesAction,
    renameProfileAction,
    switchProfileAction,
} from "@/actions/profiles.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Profile } from "@/types/profile";
import { Check, ChevronsUpDown, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const TOAST_ID = "profile-action";

/** Seletor do perfil de estudo (PMPE, Agente Censitário...) com criação, renomeação e exclusão. */
export function ProfileSwitcher() {
    const router = useRouter();
    const pathname = usePathname();

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        const state = await getProfilesAction();
        setProfiles(state.profiles);
        setActiveId(state.activeProfileId);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const active = profiles.find((profile) => profile.id === activeId) ?? null;

    // Depois de trocar de perfil, páginas de uma matéria específica (de outro perfil) não fazem mais sentido.
    const refreshView = () => {
        if (/^\/(materias|notas)\/.+/.test(pathname)) router.push("/");
        else router.refresh();
    };

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

    const handleSwitch = async (profileId: string) => {
        if (isBusy || profileId === activeId) return;
        setIsBusy(true);
        toast.loading("Trocando de perfil...", { id: TOAST_ID });

        try {
            const result = await switchProfileAction(profileId);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setActiveId(profileId);
            setOpen(false);
            refreshView();
        } catch {
            toast.error("Erro ao trocar de perfil.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isBusy || !newName.trim()) return;
        setIsBusy(true);
        toast.loading("Criando perfil...", { id: TOAST_ID });

        try {
            const result = await createProfileAction(newName);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            setNewName("");
            setOpen(false);
            await load();
            refreshView();
        } catch {
            toast.error("Erro ao criar o perfil.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const handleRename = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isBusy || !editingId || !editingName.trim()) return;
        setIsBusy(true);
        toast.loading("Renomeando perfil...", { id: TOAST_ID });

        try {
            const result = await renameProfileAction(editingId, editingName);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            resetEditing();
            await load();
            router.refresh();
        } catch {
            toast.error("Erro ao renomear o perfil.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    const handleDelete = async (profileId: string) => {
        if (isBusy) return;
        setIsBusy(true);
        toast.loading("Excluindo perfil...", { id: TOAST_ID });

        try {
            const result = await deleteProfileAction(profileId);
            if (!result.success) {
                toast.error(result.message, { id: TOAST_ID });
                return;
            }
            toast.success(result.message, { id: TOAST_ID });
            resetEditing();
            await load();
            refreshView();
        } catch {
            toast.error("Erro ao excluir o perfil.", { id: TOAST_ID });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => handleOpenChange(true)}
                title={active ? `Perfil: ${active.name}` : "Trocar de perfil de estudo"}
                aria-label="Trocar de perfil de estudo"
                className="max-w-56 gap-1.5 max-sm:w-8 max-sm:px-0"
            >
                <Layers size={15} className="shrink-0" />
                <span className="truncate max-sm:hidden">{active?.name ?? "Perfil"}</span>
                <ChevronsUpDown size={14} className="shrink-0 opacity-60 max-sm:hidden" />
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Perfis de estudo</DialogTitle>
                        <DialogDescription>
                            Cada perfil tem as próprias matérias, assuntos, revisões, notas, cronograma, ciclo e desempenho.
                        </DialogDescription>
                    </DialogHeader>

                    <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                        {profiles.map((profile) => {
                            const isActive = profile.id === activeId;
                            const isEditing = editingId === profile.id;
                            const isDeleting = deletingId === profile.id;

                            if (isEditing) {
                                return (
                                    <li key={profile.id}>
                                        <form onSubmit={handleRename} className="flex items-center gap-1.5">
                                            <Input
                                                autoFocus
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                maxLength={60}
                                                aria-label="Novo nome do perfil"
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
                                    <li key={profile.id} className="space-y-2 rounded-md border border-destructive/50 p-2 text-sm">
                                        <p>
                                            Excluir <strong>{profile.name}</strong>? Todas as matérias, assuntos, notas, cronograma,
                                            questões e o ciclo deste perfil serão apagados. Não dá para desfazer.
                                        </p>
                                        <div className="flex justify-end gap-1.5">
                                            <Button type="button" size="sm" variant="outline" onClick={() => setDeletingId(null)} disabled={isBusy}>
                                                Cancelar
                                            </Button>
                                            <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(profile.id)} disabled={isBusy}>
                                                Excluir perfil
                                            </Button>
                                        </div>
                                    </li>
                                );
                            }

                            return (
                                <li
                                    key={profile.id}
                                    className={`flex items-center gap-1.5 rounded-md border p-1 ${isActive ? "border-primary bg-primary/5" : ""}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSwitch(profile.id)}
                                        disabled={isBusy}
                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-muted disabled:opacity-60"
                                    >
                                        {isActive ? <Check size={15} className="shrink-0 text-primary" /> : <span className="w-[15px] shrink-0" />}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">{profile.name}</span>
                                            <span className="block text-xs text-muted-foreground">
                                                {profile.subjectsCount} {profile.subjectsCount === 1 ? "matéria" : "matérias"}
                                            </span>
                                        </span>
                                    </button>

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={isBusy}
                                        onClick={() => { setDeletingId(null); setEditingId(profile.id); setEditingName(profile.name); }}
                                        title="Renomear perfil"
                                    >
                                        <Pencil size={14} />
                                    </Button>
                                    {profiles.length > 1 && (
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            disabled={isBusy}
                                            onClick={() => { setEditingId(null); setDeletingId(profile.id); }}
                                            title="Excluir perfil"
                                        >
                                            <Trash2 size={14} className="text-destructive" />
                                        </Button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <form onSubmit={handleCreate} className="space-y-2 border-t pt-3">
                        <h3 className="text-sm font-semibold">Novo perfil</h3>
                        <div className="flex items-center gap-1.5">
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex.: PMPE"
                                maxLength={60}
                                aria-label="Nome do novo perfil"
                                disabled={isBusy}
                            />
                            <Button type="submit" disabled={isBusy || !newName.trim()}>
                                <Plus size={15} /> Criar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

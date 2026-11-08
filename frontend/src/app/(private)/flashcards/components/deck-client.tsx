"use client";

import {
    createCardsAction,
    deleteCardAction,
    deleteDeckAction,
    resetCardAction,
    updateCardAction,
    updateDeckAction,
} from "@/actions/flashcards.actions";
import { DialogDemo } from "@/components/dialog-button";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Deck, Flashcard, FlashcardState } from "@/types/flashcard";
import { CornerDownLeft, FileUp, Pencil, Play, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeckCountsBadges, hasCardsToStudy } from "./deck-counts";
import { DeckFormFields, DeckFormValues } from "./deck-form-fields";

const STATE_LABEL: Record<FlashcardState, string> = {
    new: "Novo",
    learning: "Aprendendo",
    review: "Revisão",
    relearning: "Reaprendendo",
};

const STATE_STYLE: Record<FlashcardState, string> = {
    new: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
    learning: "bg-red-500/12 text-red-700 dark:text-red-300",
    review: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    relearning: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
};

const formatDue = (due: string) =>
    new Date(due).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

/**
 * Importação em massa: uma linha por cartão, com frente e verso separados por TAB ou ponto e vírgula
 * (formato que o Excel/Planilhas e o Anki exportam).
 */
function parseBulk(raw: string): { cards: { front: string; back: string }[]; invalid: number } {
    const cards: { front: string; back: string }[] = [];
    let invalid = 0;

    for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue;

        const separator = line.includes("\t") ? "\t" : ";";
        const index = line.indexOf(separator);
        const front = index === -1 ? "" : line.slice(0, index).trim();
        const back = index === -1 ? "" : line.slice(index + 1).trim();

        if (front && back) cards.push({ front, back });
        else invalid++;
    }

    return { cards, invalid };
}

export function DeckClient({ deck, cards }: { deck: Deck; cards: Flashcard[] }) {
    const router = useRouter();
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [deckForm, setDeckForm] = useState<DeckFormValues>({ name: deck.name, description: deck.description, color: deck.color });

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkText, setBulkText] = useState("");

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return cards;
        return cards.filter((card) => card.front.toLowerCase().includes(term) || card.back.toLowerCase().includes(term));
    }, [cards, query]);

    async function addCard(event?: FormEvent) {
        event?.preventDefault();
        if (saving) return;

        if (!front.trim() || !back.trim()) {
            toast.error("Preencha a frente e o verso.");
            return;
        }

        setSaving(true);
        const result = await createCardsAction(deck.id, [{ front, back }]);
        setSaving(false);

        if (!result.success) {
            toast.error(result.message);
            return;
        }

        toast.success(result.message);
        setFront("");
        setBack("");
        document.getElementById("new-card-front")?.focus();
    }

    async function handleBulk(event: FormEvent) {
        event.preventDefault();

        const { cards: parsed, invalid } = parseBulk(bulkText);
        if (parsed.length === 0) {
            toast.error("Nenhuma linha válida. Use: frente;verso (uma por linha).");
            return;
        }

        toast.loading("Importando cartões...", { id: "bulk-cards" });
        const result = await createCardsAction(deck.id, parsed);

        if (!result.success) {
            toast.error(result.message, { id: "bulk-cards" });
            return;
        }

        toast.success(invalid > 0 ? `${result.message} (${invalid} linha(s) ignorada(s))` : result.message, { id: "bulk-cards" });
        setBulkText("");
        setBulkOpen(false);
    }

    async function handleUpdateDeck(event: FormEvent) {
        event.preventDefault();

        toast.loading("Salvando...", { id: "update-deck" });
        const result = await updateDeckAction(deck.id, deckForm);

        if (!result.success) {
            toast.error(result.message, { id: "update-deck" });
            return;
        }

        toast.success(result.message, { id: "update-deck" });
        setEditOpen(false);
    }

    async function handleDeleteDeck(event: FormEvent) {
        event.preventDefault();

        toast.loading("Excluindo baralho...", { id: "delete-deck" });
        const result = await deleteDeckAction(deck.id);

        if (!result.success) {
            toast.error(result.message, { id: "delete-deck" });
            return;
        }

        toast.success(result.message, { id: "delete-deck" });
        router.push("/flashcards");
    }

    const canStudy = hasCardsToStudy(deck.counts);

    return (
        <div className="flex flex-col">
            <Link href="/flashcards" className="mb-3 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <CornerDownLeft className="size-3.5" /> Baralhos
            </Link>

            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <span className="inline-block size-4 shrink-0 rounded-full" style={{ backgroundColor: deck.color }} aria-hidden="true" />
                        <span className="truncate">{deck.name}</span>
                    </span>
                }
                description={deck.description || `${deck.counts.total} ${deck.counts.total === 1 ? "cartão" : "cartões"} neste baralho.`}
                actions={
                    <>
                        <DialogDemo
                            contentBtn={<Pencil className="size-4" />}
                            title="Editar baralho"
                            description="Altere o nome, a descrição ou a cor."
                            nameConfirmBtn="Salvar"
                            onSubmit={handleUpdateDeck}
                            open={editOpen}
                            onOpenChange={(next) => {
                                if (next) setDeckForm({ name: deck.name, description: deck.description, color: deck.color });
                                setEditOpen(next);
                            }}
                            classNameBtn="size-8 p-0"
                        >
                            <DeckFormFields idPrefix="edit-deck" values={deckForm} onChange={setDeckForm} />
                        </DialogDemo>

                        <DialogDemo
                            contentBtn={<Trash2 className="size-4" />}
                            variantDialogBtn="destructive"
                            title="Excluir baralho"
                            description={`Excluir "${deck.name}" apaga também os ${deck.counts.total} cartões e todo o progresso de estudo. Esta ação não pode ser desfeita.`}
                            nameConfirmBtn="Excluir"
                            variantConfirmBtn="destructive"
                            onSubmit={handleDeleteDeck}
                            classNameBtn="size-8 p-0"
                        >
                            <></>
                        </DialogDemo>

                        {canStudy ? (
                            <Link href={`/flashcards/${deck.id}/estudar`} className={buttonVariants({ size: "sm" })}>
                                <Play /> Estudar agora
                            </Link>
                        ) : (
                            <Button size="sm" variant="outline" disabled>{deck.counts.total === 0 ? "Sem cartões" : "Tudo em dia"}</Button>
                        )}
                    </>
                }
            />

            <div className="glass mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
                <DeckCountsBadges counts={deck.counts} />
                <p className="text-xs text-muted-foreground">
                    Disponíveis para estudar agora. Limite diário: 20 novos e 200 revisões.
                </p>
            </div>

            {/* Novo cartão */}
            <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-medium">Novo cartão</h2>
                    <DialogDemo
                        contentBtn={<span className="flex items-center gap-1"><FileUp className="size-3.5" /> Importar vários</span>}
                        title="Importar cartões"
                        description="Cole uma linha por cartão, com a frente e o verso separados por ponto e vírgula (ou TAB)."
                        nameConfirmBtn="Importar"
                        onSubmit={handleBulk}
                        open={bulkOpen}
                        onOpenChange={setBulkOpen}
                        classNameBtn="h-7 rounded-lg px-2.5 text-xs"
                        contentClassName="sm:max-w-lg"
                    >
                        <Textarea
                            className="min-h-48 font-mono text-xs"
                            placeholder={"Capital do Brasil;Brasília\nPrazo do mandado de segurança;120 dias"}
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            {parseBulk(bulkText).cards.length} cartão(ões) reconhecido(s). Até 500 por vez.
                        </p>
                    </DialogDemo>
                </div>

                {/* O diálogo de importação fica fora deste <form>: eventos de submit de portais sobem pelo React. */}
                <form onSubmit={addCard} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                        <Label htmlFor="new-card-front">Frente (pergunta ou termo)</Label>
                        <Textarea
                            id="new-card-front"
                            value={front}
                            maxLength={5000}
                            onChange={(e) => setFront(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void addCard(); }}
                            placeholder="O que você quer lembrar?"
                        />
                    </Field>
                    <Field>
                        <Label htmlFor="new-card-back">Verso (resposta ou definição)</Label>
                        <Textarea
                            id="new-card-back"
                            value={back}
                            maxLength={5000}
                            onChange={(e) => setBack(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void addCard(); }}
                            placeholder="A resposta"
                        />
                    </Field>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground max-sm:hidden">Dica: Ctrl + Enter adiciona o cartão.</span>
                    <Button type="submit" disabled={saving} className="ml-auto">
                        <Plus /> Adicionar cartão
                    </Button>
                </div>
                </form>
            </div>

            {/* Lista */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-medium">Cartões ({cards.length})</h2>
                {cards.length > 0 && (
                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input className="pl-9" placeholder="Buscar nos cartões" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                )}
            </div>

            {cards.length === 0 ? (
                <div className="glass rounded-2xl px-6 py-10 text-center">
                    <p className="font-medium">Nenhum cartão ainda.</p>
                    <p className="mt-1 text-sm text-muted-foreground">Adicione o primeiro acima para começar a estudar.</p>
                </div>
            ) : filtered.length === 0 ? (
                <p className="glass rounded-2xl px-6 py-8 text-center text-sm text-muted-foreground">Nenhum cartão encontrado para essa busca.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {filtered.map((card) => (
                        <CardRow key={card.id} deckId={deck.id} card={card} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function CardRow({ deckId, card }: { deckId: string; card: Flashcard }) {
    const [open, setOpen] = useState(false);
    const [front, setFront] = useState(card.front);
    const [back, setBack] = useState(card.back);

    async function handleSave(event: FormEvent) {
        event.preventDefault();

        if (!front.trim() || !back.trim()) {
            toast.error("Preencha a frente e o verso.");
            return;
        }

        toast.loading("Salvando...", { id: `card-${card.id}` });
        const result = await updateCardAction(deckId, card.id, { front, back });

        if (!result.success) {
            toast.error(result.message, { id: `card-${card.id}` });
            return;
        }

        toast.success(result.message, { id: `card-${card.id}` });
        setOpen(false);
    }

    async function handleDelete(event: FormEvent) {
        event.preventDefault();

        toast.loading("Excluindo...", { id: `card-${card.id}` });
        const result = await deleteCardAction(deckId, card.id);
        if (result.success) toast.success(result.message, { id: `card-${card.id}` });
        else toast.error(result.message, { id: `card-${card.id}` });
    }

    async function handleReset() {
        toast.loading("Reiniciando...", { id: `card-${card.id}` });
        const result = await resetCardAction(deckId, card.id);
        if (result.success) toast.success(result.message, { id: `card-${card.id}` });
        else toast.error(result.message, { id: `card-${card.id}` });
    }

    const schedule =
        card.state === "new"
            ? "Ainda não estudado"
            : card.state === "review"
                ? `Próxima revisão: ${formatDue(card.due)} · intervalo ${card.interval} d · facilidade ${Math.round(card.ease * 100)}%`
                : "Em aprendizado";

    return (
        <li className="glass flex items-start gap-3 rounded-2xl px-4 py-3">
            <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-2 sm:gap-6">
                <p className="line-clamp-3 text-sm font-medium whitespace-pre-wrap">{card.front}</p>
                <p className="line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">{card.back}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:col-span-2">
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium", STATE_STYLE[card.state])}>{STATE_LABEL[card.state]}</span>
                    <span className="text-xs text-muted-foreground">{schedule}</span>
                    {card.lapses > 0 && <span className="text-xs text-muted-foreground">· {card.lapses} {card.lapses === 1 ? "erro" : "erros"}</span>}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <DialogDemo
                    contentBtn={<Pencil className="size-3.5" />}
                    variantDialogBtn="ghost"
                    title="Editar cartão"
                    description="O agendamento de estudo do cartão é mantido."
                    nameConfirmBtn="Salvar"
                    onSubmit={handleSave}
                    open={open}
                    onOpenChange={(next) => {
                        if (next) { setFront(card.front); setBack(card.back); }
                        setOpen(next);
                    }}
                    classNameBtn="size-8 p-0"
                    contentClassName="sm:max-w-lg"
                >
                    <FieldGroup>
                        <Field>
                            <Label htmlFor={`edit-front-${card.id}`}>Frente</Label>
                            <Textarea id={`edit-front-${card.id}`} value={front} maxLength={5000} onChange={(e) => setFront(e.target.value)} />
                        </Field>
                        <Field>
                            <Label htmlFor={`edit-back-${card.id}`}>Verso</Label>
                            <Textarea id={`edit-back-${card.id}`} value={back} maxLength={5000} onChange={(e) => setBack(e.target.value)} />
                        </Field>
                    </FieldGroup>
                </DialogDemo>

                {card.state !== "new" && (
                    <Button variant="ghost" size="icon-sm" onClick={handleReset} title="Reiniciar progresso do cartão" aria-label="Reiniciar progresso do cartão">
                        <RotateCcw className="size-3.5" />
                    </Button>
                )}

                <DialogDemo
                    contentBtn={<Trash2 className="size-3.5" />}
                    variantDialogBtn="ghost"
                    title="Excluir cartão"
                    description="Este cartão e o progresso dele serão apagados."
                    nameConfirmBtn="Excluir"
                    variantConfirmBtn="destructive"
                    onSubmit={handleDelete}
                    classNameBtn="size-8 p-0 text-destructive hover:text-destructive"
                >
                    <p className="line-clamp-4 text-sm whitespace-pre-wrap text-muted-foreground">{card.front}</p>
                </DialogDemo>
            </div>
        </li>
    );
}

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { buildBackup, buildCsv, cardToBackup, downloadTextFile, fileSlug, parseCardsInput } from "@/lib/flashcard-io";
import { cn } from "@/lib/utils";
import { Deck, Flashcard, FlashcardState } from "@/types/flashcard";
import { CornerDownLeft, Download, FileUp, Pencil, Play, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeckSettingsDialog } from "./deck-settings-dialog";
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

// Mesmo tamanho para os botões Importar/Exportar (o ! vence o h-9 padrão do DialogDemo).
const TOOL_BUTTON = "h-8! gap-1.5 rounded-lg! px-3! text-[0.8rem]!";

const MAX_FILE_BYTES = 450 * 1024; // o servidor aceita corpos de até 500 KB

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
    const [bulkFileName, setBulkFileName] = useState("");
    const [exportOpen, setExportOpen] = useState(false);

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

        const { cards: parsed, invalid } = parseCardsInput(bulkText);
        if (parsed.length === 0) {
            toast.error("Nenhum cartão válido. Use: frente;verso (uma linha por cartão) ou um arquivo JSON.");
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
        setBulkFileName("");
        setBulkOpen(false);
    }

    async function handleBulkFile(file: File | undefined) {
        if (!file) return;

        if (file.size > MAX_FILE_BYTES) {
            toast.error("Arquivo muito grande. Divida em partes de até 450 KB.");
            return;
        }

        setBulkText(await file.text());
    }

    function exportCsv() {
        downloadTextFile(`${fileSlug(deck.name)}.csv`, buildCsv(cards), "text/csv");
        setExportOpen(false);
    }

    function exportJson() {
        const backup = buildBackup([{ name: deck.name, description: deck.description, color: deck.color, cards: cards.map(cardToBackup) }]);
        downloadTextFile(`${fileSlug(deck.name)}.json`, backup, "application/json");
        setExportOpen(false);
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

                        <DeckSettingsDialog deck={deck} />

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
                    Disponíveis para estudar agora. Limite diário: {deck.settings.newPerDay} novos e {deck.settings.reviewsPerDay} revisões.
                </p>
            </div>

            {/* Novo cartão */}
            <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-medium">Novo cartão</h2>
                    <div className="flex items-center gap-1.5">
                        <DialogDemo
                            contentBtn={<span className="flex items-center gap-1"><FileUp className="size-4" /> Importar</span>}
                            title="Importar cartões"
                            description="Escolha um arquivo (.csv, .txt ou .json) ou cole uma linha por cartão, com frente e verso separados por ponto e vírgula, vírgula ou TAB."
                            nameConfirmBtn="Importar"
                            onSubmit={handleBulk}
                            open={bulkOpen}
                            onOpenChange={setBulkOpen}
                            classNameBtn={TOOL_BUTTON}
                            contentClassName="sm:max-w-lg"
                        >
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <input
                                        id="import-file"
                                        type="file"
                                        accept=".csv,.tsv,.txt,.json,text/csv,text/plain,application/json"
                                        className="peer sr-only"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            setBulkFileName(file?.name ?? "");
                                            void handleBulkFile(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    <label
                                        htmlFor="import-file"
                                        className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-foreground/25 bg-foreground/4 px-4 py-5 text-center transition-colors hover:border-primary/60 hover:bg-primary/8 peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/35"
                                    >
                                        <FileUp className="size-5 text-muted-foreground" aria-hidden="true" />
                                        {bulkFileName ? (
                                            <>
                                                <span className="max-w-full truncate text-sm font-medium">{bulkFileName}</span>
                                                <span className="text-xs text-muted-foreground">Clique para trocar o arquivo</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-sm font-medium">Escolher arquivo</span>
                                                <span className="text-xs text-muted-foreground">.csv, .txt ou .json (até 450 KB)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                <p className="text-center text-xs text-muted-foreground">ou cole o texto abaixo</p>
                                <Textarea
                                    className="min-h-40 font-mono text-xs"
                                    placeholder={"Capital do Brasil;Brasília\nPrazo do mandado de segurança;120 dias"}
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {parseCardsInput(bulkText).cards.length} cartão(ões) reconhecido(s). Até 500 por vez. Backups JSON entram sem o progresso de estudo.
                                </p>
                            </div>
                        </DialogDemo>

                        <Popover open={exportOpen} onOpenChange={setExportOpen}>
                            <PopoverTrigger
                                disabled={cards.length === 0}
                                className={cn(buttonVariants({ variant: "outline" }), TOOL_BUTTON)}
                            >
                                <Download className="size-4" /> Exportar
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 gap-0.5 p-1.5">
                                <button type="button" onClick={exportCsv} className="flex flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-foreground/6">
                                    <span className="text-sm font-medium">CSV (frente;verso)</span>
                                    <span className="text-xs text-muted-foreground">Abre no Excel/Planilhas. Sem progresso.</span>
                                </button>
                                <button type="button" onClick={exportJson} className="flex flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-foreground/6">
                                    <span className="text-sm font-medium">Backup (JSON)</span>
                                    <span className="text-xs text-muted-foreground">Inclui intervalos e datas de revisão.</span>
                                </button>
                            </PopoverContent>
                        </Popover>
                    </div>
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

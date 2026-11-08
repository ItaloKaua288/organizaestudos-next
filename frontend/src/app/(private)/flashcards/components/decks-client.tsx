"use client";

import { createDeckAction, exportFlashcardsAction, importFlashcardsAction } from "@/actions/flashcards.actions";
import { DialogDemo } from "@/components/dialog-button";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildBackup, downloadTextFile, parseBackup } from "@/lib/flashcard-io";
import { cn } from "@/lib/utils";
import { Deck } from "@/types/flashcard";
import { Download, Layers, Play, Plus, Settings2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { DeckCountsBadges, hasCardsToStudy } from "./deck-counts";
import { DeckFormFields, DeckFormValues, EMPTY_DECK_FORM } from "./deck-form-fields";

export function DecksClient({ decks }: { decks: Deck[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<DeckFormValues>(EMPTY_DECK_FORM);

    const fileInput = useRef<HTMLInputElement>(null);

    async function handleExportAll() {
        toast.loading("Preparando backup...", { id: "export-flashcards" });
        const result = await exportFlashcardsAction();

        if (!result.success || !result.decks) {
            toast.error(result.message || "Não foi possível exportar.", { id: "export-flashcards" });
            return;
        }

        downloadTextFile("flashcards-backup.json", buildBackup(result.decks), "application/json");
        toast.success("Backup baixado!", { id: "export-flashcards" });
    }

    async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (file.size > 450 * 1024) {
            toast.error("Arquivo muito grande. O limite é de 450 KB por importação.");
            return;
        }

        const backup = parseBackup(await file.text());
        if (!backup) {
            toast.error("Arquivo inválido. Use um backup JSON exportado por aqui.");
            return;
        }

        toast.loading("Importando...", { id: "import-flashcards" });
        const result = await importFlashcardsAction(backup);

        if (result.success) toast.success(result.message, { id: "import-flashcards" });
        else toast.error(result.message, { id: "import-flashcards" });
    }

    async function handleCreate(event: FormEvent) {
        event.preventDefault();

        if (!form.name.trim()) {
            toast.error("Dê um nome ao baralho.");
            return;
        }

        toast.loading("Criando baralho...", { id: "create-deck" });
        const result = await createDeckAction(form);

        if (!result.success) {
            toast.error(result.message, { id: "create-deck" });
            return;
        }

        toast.success(result.message, { id: "create-deck" });
        setForm(EMPTY_DECK_FORM);
        setOpen(false);

        // Já abre o baralho novo para adicionar os primeiros cartões.
        if (result.deck) router.push(`/flashcards/${result.deck.id}`);
        else router.refresh();
    }

    return (
        <div className="flex flex-col">
            <PageHeader
                title="Flashcards"
                description="Crie cartões e revise com repetição espaçada: o que você erra volta logo, o que você sabe volta só depois."
                actions={
                    <>
                    <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
                    <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} title="Importar um backup JSON (cria baralhos novos)">
                        <Upload /> <span className="max-sm:hidden">Importar</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportAll} disabled={decks.length === 0} title="Baixar todos os baralhos, com progresso">
                        <Download /> <span className="max-sm:hidden">Exportar tudo</span>
                    </Button>
                    <DialogDemo
                        contentBtn={<span className="flex items-center gap-1"><Plus className="size-4" /> Novo baralho</span>}
                        title="Novo baralho"
                        description="Um baralho reúne os cartões de um mesmo assunto."
                        nameConfirmBtn="Criar baralho"
                        onSubmit={handleCreate}
                        open={open}
                        onOpenChange={setOpen}
                        classNameBtn="h-8 rounded-lg px-3 text-[0.8rem]"
                    >
                        <DeckFormFields idPrefix="new-deck" values={form} onChange={setForm} />
                    </DialogDemo>
                    </>
                }
            />

            {decks.length === 0 ? (
                <div className="glass flex flex-col items-center gap-1 rounded-2xl px-6 py-12 text-center">
                    <Layers className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />
                    <p className="font-medium">Você ainda não tem baralhos.</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Use o botão Novo baralho, adicione cartões com frente e verso e comece a estudar.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {decks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            )}
        </div>
    );
}

function DeckCard({ deck }: { deck: Deck }) {
    const canStudy = hasCardsToStudy(deck.counts);

    return (
        <article className="glass flex flex-col gap-4 rounded-2xl p-5">
            <div className="flex min-w-0 items-start gap-3">
                <span className="mt-1.5 inline-block size-3 shrink-0 rounded-full" style={{ backgroundColor: deck.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <Link href={`/flashcards/${deck.id}`} className="block truncate font-medium hover:text-primary hover:underline">
                        {deck.name}
                    </Link>
                    <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">
                        {deck.description || `${deck.counts.total} ${deck.counts.total === 1 ? "cartão" : "cartões"}`}
                    </p>
                </div>
            </div>

            <div className="flex items-end justify-between gap-3">
                <DeckCountsBadges counts={deck.counts} />

                <div className="flex items-center gap-1.5">
                    <Link
                        href={`/flashcards/${deck.id}`}
                        title="Gerenciar cartões"
                        aria-label="Gerenciar cartões"
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    >
                        <Settings2 />
                    </Link>
                    {canStudy ? (
                        <Link href={`/flashcards/${deck.id}/estudar`} className={cn(buttonVariants({ size: "sm" }))}>
                            <Play /> Estudar
                        </Link>
                    ) : (
                        <Button size="sm" variant="outline" disabled>
                            {deck.counts.total === 0 ? "Sem cartões" : "Em dia"}
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}

export function DecksSkeleton() {
    return (
        <div className="flex flex-col">
            <div className="space-y-2 pb-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-36 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

"use client";

import { reviewCardAction } from "@/actions/flashcards.actions";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Flashcard, FlashcardRating } from "@/types/flashcard";
import { CornerDownLeft, Eye, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const RATING_BUTTONS: {
    rating: FlashcardRating;
    key: "again" | "hard" | "good" | "easy";
    label: string;
    className: string;
}[] = [
    { rating: 1, key: "again", label: "Errei", className: "border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-300" },
    { rating: 2, key: "hard", label: "Difícil", className: "border-orange-500/40 bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-300" },
    { rating: 3, key: "good", label: "Bom", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300" },
    { rating: 4, key: "easy", label: "Fácil", className: "border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-300" },
];

/** Um cartão que ainda vai voltar hoje (aprendizado) é reinserido a poucos cartões de distância. */
const REINSERT_DISTANCE = 4;

export function StudySession({ deck, initialCards, learnAheadMinutes }: {
    deck: { id: string; name: string; color: string };
    initialCards: Flashcard[];
    learnAheadMinutes: number;
}) {
    const [queue, setQueue] = useState<Flashcard[]>(initialCards);
    const [showAnswer, setShowAnswer] = useState(false);
    const [busy, setBusy] = useState(false);
    // Quantas vezes cada nota foi usada, para o resumo final.
    const [answered, setAnswered] = useState({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });

    const current = queue[0];

    // Número de cartões distintos da sessão (os que voltam a aparecer não contam de novo).
    const [sessionTotal] = useState(initialCards.length);
    const [graduated, setGraduated] = useState(0);

    const rate = useCallback(async (rating: FlashcardRating) => {
        if (!current || busy) return;

        setBusy(true);
        const result = await reviewCardAction(current.id, rating);
        setBusy(false);

        if (!result.success || !result.card) {
            toast.error(result.message || "Não foi possível registrar a avaliação.");
            return;
        }

        const updated = result.card;
        const dueSoon = new Date(updated.due).getTime() <= Date.now() + learnAheadMinutes * 60_000;
        const comesBack = (updated.state === "learning" || updated.state === "relearning") && dueSoon;

        setQueue((previous) => {
            const rest = previous.slice(1);
            if (!comesBack) return rest;
            const position = Math.min(rest.length, REINSERT_DISTANCE);
            return [...rest.slice(0, position), updated, ...rest.slice(position)];
        });
        if (!comesBack) setGraduated((value) => value + 1);

        const key = RATING_BUTTONS.find((button) => button.rating === rating)!.key;
        setAnswered((value) => ({ ...value, total: value.total + 1, [key]: value[key] + 1 }));
        setShowAnswer(false);
    }, [current, busy, learnAheadMinutes]);

    // Atalhos: Espaço/Enter mostra a resposta; 1-4 avalia.
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

            if (!showAnswer && (event.key === " " || event.key === "Enter")) {
                event.preventDefault();
                setShowAnswer(true);
                return;
            }

            if (showAnswer && ["1", "2", "3", "4"].includes(event.key)) {
                event.preventDefault();
                void rate(Number(event.key) as FlashcardRating);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showAnswer, rate]);

    const counts = {
        new: queue.filter((card) => card.state === "new").length,
        learning: queue.filter((card) => card.state === "learning" || card.state === "relearning").length,
        review: queue.filter((card) => card.state === "review").length,
    };

    const progress = sessionTotal === 0 ? 100 : Math.round((graduated / sessionTotal) * 100);

    // ------------------------------------------------------------ Fim da sessão
    if (!current) {
        return (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
                <PartyPopper className="size-10 text-primary" aria-hidden="true" />
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {answered.total === 0 ? "Nada para estudar agora" : "Sessão concluída!"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {answered.total === 0
                        ? `O baralho "${deck.name}" está em dia. Volte mais tarde ou adicione novos cartões.`
                        : `Você avaliou ${answered.total} ${answered.total === 1 ? "cartão" : "cartões"} em "${deck.name}". Os próximos já foram agendados.`}
                </p>

                {answered.total > 0 && (
                    <dl className="glass grid w-full grid-cols-4 gap-2 rounded-2xl p-4 text-center">
                        {RATING_BUTTONS.map((button) => (
                            <div key={button.key}>
                                <dd className="text-xl font-semibold tabular-nums">{answered[button.key]}</dd>
                                <dt className="text-xs text-muted-foreground">{button.label}</dt>
                            </div>
                        ))}
                    </dl>
                )}

                <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/flashcards" className={buttonVariants({ variant: "outline" })}>
                        <CornerDownLeft /> Voltar aos baralhos
                    </Link>
                    <Link href={`/flashcards/${deck.id}`} className={buttonVariants({ variant: "ghost" })}>
                        Gerenciar cartões
                    </Link>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------ Estudo
    const stateColor = current.state === "new" ? "text-blue-600 dark:text-blue-400" : current.state === "review" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
                <Link href="/flashcards" className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <CornerDownLeft className="size-3.5 shrink-0" />
                    <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: deck.color }} aria-hidden="true" />
                    <span className="truncate">{deck.name}</span>
                </Link>

                <dl className="flex items-center gap-3 text-sm tabular-nums">
                    <div className={cn("flex items-center gap-1", current.state === "new" && "underline underline-offset-4")}>
                        <dd className="font-semibold text-blue-600 dark:text-blue-400">{counts.new}</dd>
                        <dt className="sr-only">Novos</dt>
                    </div>
                    <div className={cn("flex items-center gap-1", (current.state === "learning" || current.state === "relearning") && "underline underline-offset-4")}>
                        <dd className="font-semibold text-red-600 dark:text-red-400">{counts.learning}</dd>
                        <dt className="sr-only">Aprender</dt>
                    </div>
                    <div className={cn("flex items-center gap-1", current.state === "review" && "underline underline-offset-4")}>
                        <dd className="font-semibold text-emerald-600 dark:text-emerald-400">{counts.review}</dd>
                        <dt className="sr-only">Revisar</dt>
                    </div>
                </dl>
            </div>

            <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Progresso da sessão"
            >
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>

            <article className="glass flex min-h-72 flex-col rounded-3xl p-6 sm:p-8">
                <p className={cn("mb-4 text-xs font-medium tracking-wide uppercase", stateColor)}>
                    {current.state === "new" ? "Novo" : current.state === "review" ? "Revisão" : "Aprendendo"}
                </p>

                <div className="flex flex-1 flex-col justify-center gap-6">
                    <p className="text-lg leading-relaxed font-medium whitespace-pre-wrap sm:text-xl">{current.front}</p>

                    {showAnswer && (
                        <>
                            <hr className="border-foreground/15" />
                            <p className="text-lg leading-relaxed whitespace-pre-wrap sm:text-xl">{current.back}</p>
                        </>
                    )}
                </div>
            </article>

            {!showAnswer ? (
                <Button size="lg" className="h-12 w-full text-base" onClick={() => setShowAnswer(true)}>
                    <Eye /> Mostrar resposta
                    <kbd className="ml-2 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs font-normal max-sm:hidden">Espaço</kbd>
                </Button>
            ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RATING_BUTTONS.map((button) => (
                        <Button
                            key={button.key}
                            variant="outline"
                            disabled={busy}
                            onClick={() => rate(button.rating)}
                            className={cn("h-auto flex-col gap-0.5 py-2.5", button.className)}
                        >
                            <span className="text-sm font-semibold">{button.label}</span>
                            <span className="text-xs font-normal opacity-80">{current.previews[button.key]}</span>
                            <kbd className="text-[0.65rem] font-normal opacity-60 max-sm:hidden">{button.rating}</kbd>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

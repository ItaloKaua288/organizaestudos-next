import { Flashcard, FlashcardBackupCard, FlashcardBackupDeck } from "@/types/flashcard";

export interface ParsedCards {
    cards: { front: string; back: string }[];
    /** Linhas ignoradas por não terem frente e verso. */
    invalid: number;
}

/** Lê CSV/TSV com aspas (campos podem ter quebras de linha). O separador (TAB, ; ou ,) é detectado na 1ª linha. */
export function parseDelimited(raw: string): string[][] {
    const text = raw.replace(/^﻿/, "");
    const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
    const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (char === '"') quoted = false;
            else field += char;
        } else if (char === '"' && field === "") {
            quoted = true;
        } else if (char === delimiter) {
            row.push(field); field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[i + 1] === "\n") i++;
            row.push(field); field = "";
            rows.push(row); row = [];
        } else {
            field += char;
        }
    }
    if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }

    return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const isBackupCard = (value: unknown): value is FlashcardBackupCard =>
    typeof value === "object" && value !== null && typeof (value as FlashcardBackupCard).front === "string" && typeof (value as FlashcardBackupCard).back === "string";

/** Lê um backup JSON: {decks: [...]}, um baralho {name, cards} ou apenas uma lista de cartões. */
export function parseBackup(raw: string): FlashcardBackupDeck[] | null {
    let data: unknown;
    try { data = JSON.parse(raw); } catch { return null; }

    const asDeck = (item: unknown): FlashcardBackupDeck | null => {
        if (typeof item !== "object" || item === null) return null;
        const deck = item as Partial<FlashcardBackupDeck>;
        if (typeof deck.name !== "string" || !Array.isArray(deck.cards)) return null;
        return { name: deck.name, description: deck.description, color: deck.color, cards: deck.cards.filter(isBackupCard) };
    };

    if (Array.isArray(data)) {
        if (data.length > 0 && data.every(isBackupCard)) return [{ name: "Importado", cards: data }];
        const decks = data.map(asDeck).filter((d): d is FlashcardBackupDeck => d !== null);
        return decks.length > 0 ? decks : null;
    }

    const wrapped = (data as { decks?: unknown })?.decks;
    if (Array.isArray(wrapped)) {
        const decks = wrapped.map(asDeck).filter((d): d is FlashcardBackupDeck => d !== null);
        return decks.length > 0 ? decks : null;
    }

    const single = asDeck(data);
    return single ? [single] : null;
}

/** Cartões (só frente e verso) de um texto colado ou arquivo: CSV/TSV (frente;verso) ou JSON de backup. */
export function parseCardsInput(raw: string): ParsedCards {
    const text = raw.trim();
    if (!text) return { cards: [], invalid: 0 };

    if (text.startsWith("{") || text.startsWith("[")) {
        const decks = parseBackup(text);
        if (decks) {
            const cards = decks.flatMap((deck) => deck.cards.map((card) => ({ front: card.front.trim(), back: card.back.trim() })));
            const valid = cards.filter((card) => card.front && card.back);
            return { cards: valid, invalid: cards.length - valid.length };
        }
    }

    const cards: { front: string; back: string }[] = [];
    let invalid = 0;

    parseDelimited(text).forEach((row, index) => {
        const [front = "", back = ""] = row.map((cell) => cell.trim());

        // Ignora uma linha de cabeçalho ("frente;verso").
        if (index === 0 && /^(frente|front|pergunta)$/i.test(front) && /^(verso|back|resposta)$/i.test(back)) return;

        if (front && back) cards.push({ front, back });
        else invalid++;
    });

    return { cards, invalid };
}

const csvField = (value: string) => (/[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** CSV com ";" (abre direto no Excel/Planilhas em português) e sem progresso de estudo. */
export function buildCsv(cards: Pick<Flashcard, "front" | "back">[]): string {
    return "﻿" + ["frente;verso", ...cards.map((card) => `${csvField(card.front)};${csvField(card.back)}`)].join("\r\n");
}

export const cardToBackup = (card: Flashcard): FlashcardBackupCard => ({
    front: card.front, back: card.back, state: card.state, step: card.step, interval: card.interval,
    ease: card.ease, due: card.due, reps: card.reps, lapses: card.lapses,
});

export function buildBackup(decks: FlashcardBackupDeck[]): string {
    return JSON.stringify({ app: "organiza-estudos", type: "flashcards", version: 1, exportedAt: new Date().toISOString(), decks }, null, 2);
}

export function fileSlug(name: string) {
    return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "flashcards";
}

export function downloadTextFile(filename: string, content: string, mime: string) {
    const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

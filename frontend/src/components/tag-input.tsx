"use client";

import { MAX_NOTE_TAGS, MAX_TAG_LENGTH, normalizeTag } from "@/lib/note-tags";
import { X } from "lucide-react";
import { useId, useState } from "react";

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    /** Tags já usadas em outras notas, oferecidas como sugestão enquanto a pessoa digita. */
    suggestions?: string[];
    id?: string;
}

export function TagInput({ value, onChange, suggestions = [], id }: TagInputProps) {
    const [draft, setDraft] = useState("");
    const listId = useId();
    const atLimit = value.length >= MAX_NOTE_TAGS;

    const commit = (raw: string) => {
        const tag = normalizeTag(raw);
        setDraft("");

        if (!tag || value.includes(tag) || atLimit) return;
        onChange([...value, tag]);
    };

    const remove = (tag: string) => onChange(value.filter((item) => item !== tag));

    const available = suggestions.filter((tag) => !value.includes(tag));

    return (
        <div className="space-y-1.5">
            <div
                className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40"
            >
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/15 py-0.5 pr-1 pl-2.5 text-xs font-medium text-primary"
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={() => remove(tag)}
                            className="grid size-4 place-items-center rounded-full transition-colors hover:bg-primary/20 focus-visible:bg-primary/20 focus-visible:outline-none"
                            aria-label={`Remover a tag ${tag}`}
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}

                <input
                    id={id}
                    value={draft}
                    list={listId}
                    maxLength={MAX_TAG_LENGTH + 1}
                    disabled={atLimit}
                    placeholder={atLimit ? "Limite de tags atingido" : value.length === 0 ? "prova, revisar, resumo..." : "Nova tag"}
                    className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                    onChange={(event) => {
                        const next = event.target.value;
                        // Vírgula também fecha a tag, como em campos de e-mail.
                        if (next.includes(",")) {
                            next.split(",").forEach((part) => commit(part));
                        } else {
                            setDraft(next);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            // Dentro do diálogo, Enter enviaria o formulário da nota.
                            event.preventDefault();
                            commit(draft);
                        } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
                            remove(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => commit(draft)}
                />
                <datalist id={listId}>
                    {available.map((tag) => (
                        <option key={tag} value={tag} />
                    ))}
                </datalist>
            </div>
            <p className="text-xs text-muted-foreground">
                Enter ou vírgula adiciona. Até {MAX_NOTE_TAGS} tags por nota.
            </p>
        </div>
    );
}

"use client";

import { searchNotesAction } from "@/actions/notes.actions";
import { Input } from "@/components/ui/input";
import { noteHref } from "@/lib/note-link-extension";
import { formatRelativeTime } from "@/lib/relative-time";
import type { NoteSearchResult, RecentNote } from "@/types/note";
import type { Subject } from "@/types/subject";
import { Pin, Search, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { RedirectButton, type SubjectNotesSummary } from "./button-redirect";

export type SubjectCard = Subject & { summary: SubjectNotesSummary };
export type RecentNoteCard = RecentNote & { label: string };

type SearchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "done"; query: string; notes: NoteSearchResult[] };

const MIN_QUERY = 2;

/** Corpo da página de Anotações: busca em todas as notas, notas recentes e as matérias. */
export function NotesHome({ subjects, recent }: { subjects: SubjectCard[]; recent: RecentNoteCard[] }) {
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState<SearchState>({ status: "idle" });
    // Só a última busca vale: respostas atrasadas de buscas antigas são ignoradas.
    const requestId = useRef(0);

    const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

    const runSearch = useDebouncedCallback(async (term: string) => {
        const id = ++requestId.current;
        const result = await searchNotesAction(term);
        if (id !== requestId.current) return;

        setSearch(
            result.success
                ? { status: "done", query: term, notes: result.notes }
                : { status: "error", message: result.message ?? "Falha ao buscar." }
        );
    }, 300);

    const handleChange = (value: string) => {
        setQuery(value);
        const term = value.trim();

        if (term.length < MIN_QUERY) {
            runSearch.cancel();
            requestId.current++;
            setSearch({ status: "idle" });
            return;
        }

        setSearch({ status: "loading" });
        runSearch(term);
    };

    const clear = () => handleChange("");

    const isSearching = query.trim().length >= MIN_QUERY;

    return (
        <div className="flex flex-col gap-6">
            <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                    type="search"
                    value={query}
                    onChange={(event) => handleChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Escape" && query) {
                            event.preventDefault();
                            clear();
                        }
                    }}
                    placeholder="Buscar em todas as notas..."
                    aria-label="Buscar em todas as notas"
                    autoComplete="off"
                    className="h-9 rounded-lg pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Limpar busca"
                        title="Limpar busca"
                        className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                )}
            </div>

            {isSearching ? (
                <section aria-label="Resultados da busca" aria-live="polite" className="flex flex-col gap-2">
                    {search.status === "loading" || search.status === "idle" ? (
                        <p className="text-sm text-muted-foreground">Buscando...</p>
                    ) : search.status === "error" ? (
                        <p className="text-sm text-destructive">{search.message}</p>
                    ) : search.notes.length === 0 ? (
                        <div className="glass rounded-2xl px-6 py-10 text-center">
                            <p className="font-medium">Nenhuma nota encontrada</p>
                            <p className="mt-1 text-sm text-muted-foreground">Nada para “{search.query}”. Tente outro termo.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {search.notes.length === 1 ? "1 nota encontrada" : `${search.notes.length} notas encontradas`}
                            </p>
                            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                {search.notes.map((note) => {
                                    const subject = subjectById.get(note.subjectId);
                                    return (
                                        <li key={note.id}>
                                            <Link
                                                href={noteHref(note.subjectId, note.id)}
                                                className="glass flex h-full flex-col gap-1 rounded-2xl px-4 py-3 transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                            >
                                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? "#6b7280" }} aria-hidden="true" />
                                                    <span className="truncate">{subject?.title ?? "Matéria"}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="shrink-0">{formatRelativeTime(note.updatedAt)}</span>
                                                    {note.isPinned && <Pin size={11} className="shrink-0" aria-label="Nota fixada" />}
                                                </span>
                                                <span className="truncate font-medium">{note.title}</span>
                                                {note.snippet && <span className="line-clamp-2 text-sm text-muted-foreground">{note.snippet}</span>}
                                                {note.tags.length > 0 && (
                                                    <span className="mt-0.5 flex flex-wrap gap-1.5">
                                                        {note.tags.map((tag) => (
                                                            <span key={tag} className="rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </section>
            ) : (
                <>
                    {recent.length > 0 && (
                        <section aria-labelledby="notas-recentes" className="flex flex-col gap-3">
                            <h2 id="notas-recentes" className="text-sm font-semibold text-muted-foreground">Anotações recentes</h2>
                            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {recent.map((note) => {
                                    const subject = subjectById.get(note.subjectId);
                                    return (
                                        <li key={note.id}>
                                            <Link
                                                href={noteHref(note.subjectId, note.id)}
                                                className="glass flex h-full flex-col gap-1 rounded-2xl px-4 py-3 transition-colors hover:bg-foreground/6 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                                            >
                                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? "#6b7280" }} aria-hidden="true" />
                                                    <span className="truncate">{subject?.title ?? "Matéria"}</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="shrink-0">{note.label}</span>
                                                    {note.isPinned && <Pin size={11} className="shrink-0" aria-label="Nota fixada" />}
                                                </span>
                                                <span className="truncate font-medium">{note.title}</span>
                                                {note.preview && <span className="line-clamp-2 text-sm text-muted-foreground">{note.preview}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    <section aria-labelledby="notas-materias" className="flex flex-col gap-3">
                        {recent.length > 0 && <h2 id="notas-materias" className="text-sm font-semibold text-muted-foreground">Matérias</h2>}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {subjects.map((subject, index) => (
                                <RedirectButton key={subject.id} subject={subject} summary={subject.summary} index={index} />
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

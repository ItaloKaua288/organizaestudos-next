"use client";

import { globalSearchAction } from "@/actions/search.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchResults } from "@/types/search";
import { BookOpen, Captions, ListChecks, NotepadText, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const EMPTY: SearchResults = { query: "", subjects: [], topics: [], notes: [] };

function ResultGroup({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="space-y-1">
            <h3 className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {icon} {title}
            </h3>
            <ul className="space-y-0.5">{children}</ul>
        </section>
    );
}

function ResultLink({ href, onNavigate, color, title, subtitle }: { href: string; onNavigate: () => void; color: string; title: string; subtitle?: string }) {
    return (
        <li>
            <Link href={href} onClick={onNavigate} className="flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{title}</span>
                    {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
                </span>
            </Link>
        </li>
    );
}

/** Busca global (matérias, assuntos e notas). Abre pelo botão do menu ou com Ctrl/⌘ + K. */
export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Evita que uma resposta antiga (digitação rápida) sobrescreva a mais nova.
    const requestId = useRef(0);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const runSearch = useDebouncedCallback(async (value: string) => {
        const current = ++requestId.current;
        const response = await globalSearchAction(value);
        if (current !== requestId.current) return;

        setIsLoading(false);
        if (response.success) {
            setError(null);
            setResults(response.results);
        } else {
            setError(response.message ?? "Não foi possível buscar agora.");
            setResults(EMPTY);
        }
    }, 300);

    const handleChange = (value: string) => {
        setTerm(value);

        if (value.trim().length < 2) {
            runSearch.cancel();
            requestId.current++;
            setIsLoading(false);
            setError(null);
            setResults(EMPTY);
            return;
        }

        setIsLoading(true);
        runSearch(value);
    };

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) {
            runSearch.cancel();
            requestId.current++;
            setTerm("");
            setResults(EMPTY);
            setIsLoading(false);
            setError(null);
        }
    };

    const close = () => handleOpenChange(false);

    const hasQuery = term.trim().length >= 2;
    const total = results.subjects.length + results.topics.length + results.notes.length;

    return (
        <>
            <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Buscar (Ctrl+K)" title="Buscar (Ctrl+K)">
                <Search className="h-4 w-4" />
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="top-24 -translate-y-0 sm:max-w-lg" showCloseButton={false}>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Busca global</DialogTitle>
                        <DialogDescription>Busque em matérias, assuntos e notas.</DialogDescription>
                    </DialogHeader>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            type="search"
                            value={term}
                            onChange={(event) => handleChange(event.target.value)}
                            placeholder="Buscar matérias, assuntos e notas..."
                            className="pl-8"
                            aria-label="Termo da busca"
                        />
                    </div>

                    <div className="max-h-[60vh] space-y-3 overflow-y-auto" aria-live="polite">
                        {!hasQuery && <p className="px-1 text-sm text-muted-foreground">Digite pelo menos 2 letras.</p>}
                        {hasQuery && isLoading && <p className="px-1 text-sm text-muted-foreground">Buscando...</p>}
                        {hasQuery && !isLoading && error && <p className="px-1 text-sm text-destructive">{error}</p>}
                        {hasQuery && !isLoading && !error && total === 0 && (
                            <p className="px-1 text-sm text-muted-foreground">Nada encontrado para &quot;{term.trim()}&quot;.</p>
                        )}

                        {!isLoading && results.subjects.length > 0 && (
                            <ResultGroup title="Matérias" icon={<Captions className="h-3.5 w-3.5" />}>
                                {results.subjects.map((subject) => (
                                    <ResultLink key={subject.id} href={`/materias/${subject.id}`} onNavigate={close} color={subject.color} title={subject.title} />
                                ))}
                            </ResultGroup>
                        )}

                        {!isLoading && results.topics.length > 0 && (
                            <ResultGroup title="Assuntos" icon={<ListChecks className="h-3.5 w-3.5" />}>
                                {results.topics.map((topic) => (
                                    <ResultLink
                                        key={topic.id}
                                        href={`/materias/${topic.subjectId}`}
                                        onNavigate={close}
                                        color={topic.subjectColor}
                                        title={topic.title}
                                        subtitle={`${topic.isSubtopic ? "Subassunto · " : ""}${topic.subjectTitle} · ${topic.status === "CONCLUIDO" ? "Concluído" : "Pendente"}`}
                                    />
                                ))}
                            </ResultGroup>
                        )}

                        {!isLoading && results.notes.length > 0 && (
                            <ResultGroup title="Notas" icon={<NotepadText className="h-3.5 w-3.5" />}>
                                {results.notes.map((note) => (
                                    <ResultLink
                                        key={note.id}
                                        href={`/notas/${note.subjectId}?q=${encodeURIComponent(results.query)}`}
                                        onNavigate={close}
                                        color={note.subjectColor}
                                        title={note.title}
                                        subtitle={note.snippet || note.subjectTitle}
                                    />
                                ))}
                            </ResultGroup>
                        )}
                    </div>

                    <p className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" /> Só matérias ativas aparecem na busca.
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}

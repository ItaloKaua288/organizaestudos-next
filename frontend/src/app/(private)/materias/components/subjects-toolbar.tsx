"use client";

import { cn } from "@/lib/utils";
import { ArrowDownAZ, ArrowUpDown, CheckCircle2, EyeOff, Search, X } from "lucide-react";
import { useId } from "react";
import { MateriasViewPrefs, SubjectSort } from "./view-prefs";

type SubjectsToolbarProps = {
    prefs: MateriasViewPrefs;
    onPrefsChange: (prefs: MateriasViewPrefs) => void;
    query: string;
    onQueryChange: (query: string) => void;
    showSearch: boolean;
    /** Quantas matérias aparecem agora / quantas existem. */
    visibleCount: number;
    totalCount: number;
    /** Arrastar só funciona na ordem manual e sem busca/filtros. */
    canReorder: boolean;
};

const SORT_OPTIONS: { value: SubjectSort; label: string }[] = [
    { value: "manual", label: "Ordem manual" },
    { value: "nome", label: "Nome (A–Z)" },
    { value: "progresso", label: "Menos concluída primeiro" },
];

const CHIP =
    "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";

export function SubjectsToolbar({
    prefs,
    onPrefsChange,
    query,
    onQueryChange,
    showSearch,
    visibleCount,
    totalCount,
    canReorder,
}: SubjectsToolbarProps) {
    const searchId = useId();
    const sortId = useId();
    const hasFilters = prefs.hideDone || prefs.hideInactive || query.trim() !== "";

    const clearFilters = () => {
        onQueryChange("");
        onPrefsChange({ ...prefs, hideDone: false, hideInactive: false });
    };

    return (
        <div className="mb-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                {showSearch && (
                    <div className="relative min-w-44 flex-1 sm:max-w-xs">
                        <label htmlFor={searchId} className="sr-only">Buscar matéria</label>
                        <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <input
                            id={searchId}
                            type="search"
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Escape" && query) {
                                    event.preventDefault();
                                    onQueryChange("");
                                }
                            }}
                            placeholder="Buscar matéria..."
                            autoComplete="off"
                            className="glass h-8 w-full rounded-lg pr-8 pl-8 text-[0.8rem] outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => onQueryChange("")}
                                aria-label="Limpar busca"
                                title="Limpar busca"
                                className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground"
                            >
                                <X size={13} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}

                <div className="glass relative inline-flex h-8 items-center rounded-lg text-[0.8rem]">
                    <label htmlFor={sortId} className="sr-only">Ordenar matérias</label>
                    {prefs.sort === "nome"
                        ? <ArrowDownAZ size={14} className="pointer-events-none absolute left-2.5 text-muted-foreground" aria-hidden="true" />
                        : <ArrowUpDown size={14} className="pointer-events-none absolute left-2.5 text-muted-foreground" aria-hidden="true" />}
                    <select
                        id={sortId}
                        value={prefs.sort}
                        onChange={(event) => onPrefsChange({ ...prefs, sort: event.target.value as SubjectSort })}
                        className="h-full cursor-pointer appearance-none rounded-lg bg-transparent pr-3 pl-8 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&>option]:bg-background [&>option]:text-foreground"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    aria-pressed={prefs.hideDone}
                    onClick={() => onPrefsChange({ ...prefs, hideDone: !prefs.hideDone })}
                    title="Esconder matérias com todos os assuntos concluídos"
                    className={cn(CHIP, prefs.hideDone
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "glass border-transparent text-muted-foreground hover:text-foreground")}
                >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Ocultar concluídas
                </button>

                <button
                    type="button"
                    aria-pressed={prefs.hideInactive}
                    onClick={() => onPrefsChange({ ...prefs, hideInactive: !prefs.hideInactive })}
                    title="Esconder matérias desativadas"
                    className={cn(CHIP, prefs.hideInactive
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "glass border-transparent text-muted-foreground hover:text-foreground")}
                >
                    <EyeOff size={14} aria-hidden="true" />
                    Ocultar desativadas
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-live="polite">
                {hasFilters && (
                    <>
                        <span>
                            Mostrando <span className="font-medium tabular-nums text-foreground">{visibleCount}</span> de{" "}
                            <span className="tabular-nums">{totalCount}</span> matérias
                        </span>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="cursor-pointer font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                        >
                            Limpar filtros
                        </button>
                    </>
                )}
                {!canReorder && totalCount > 1 && (
                    <span>
                        {prefs.sort !== "manual"
                            ? "Para arrastar e reordenar, escolha “Ordem manual”."
                            : "Para arrastar e reordenar, limpe a busca e os filtros."}
                    </span>
                )}
            </div>
        </div>
    );
}

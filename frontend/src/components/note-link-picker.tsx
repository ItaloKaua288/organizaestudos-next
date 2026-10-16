"use client";

import { getNoteLinkTargetsAction } from "@/actions/notes.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NoteLinkTarget } from "@/types/note";
import type { Editor } from "@tiptap/react";
import { Link2Off, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface NoteLinkPickerProps {
    editor: Editor;
    currentNoteId?: string;
    onClose: () => void;
}

/**
 * Painel que aparece abaixo da barra do editor para escolher a nota de destino de um link.
 * Com texto selecionado, o texto vira o link. Sem seleção, o título da nota é inserido já linkado.
 */
export function NoteLinkPicker({ editor, currentNoteId, onClose }: NoteLinkPickerProps) {
    const [targets, setTargets] = useState<NoteLinkTarget[] | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let cancelled = false;

        getNoteLinkTargetsAction().then((result) => {
            if (!cancelled) setTargets(result);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const results = useMemo(() => {
        const term = query.trim().toLowerCase();

        return (targets ?? [])
            .filter((target) => target.id !== currentNoteId)
            .filter((target) =>
                !term ||
                target.title.toLowerCase().includes(term) ||
                target.subjectTitle.toLowerCase().includes(term)
            );
    }, [targets, query, currentNoteId]);

    const hasSelection = !editor.state.selection.empty;
    const isOnLink = editor.isActive("noteLink");

    const applyLink = (target: NoteLinkTarget) => {
        const attrs = { noteId: target.id, subjectId: target.subjectId };

        if (hasSelection) {
            editor.chain().focus().setNoteLink(attrs).run();
        } else {
            editor
                .chain()
                .focus()
                .insertContent([
                    { type: "text", text: target.title, marks: [{ type: "noteLink", attrs }] },
                    { type: "text", text: " " },
                ])
                .run();
        }

        onClose();
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange("noteLink").unsetNoteLink().run();
        onClose();
    };

    return (
        <div className="space-y-2 border-x border-input bg-foreground/3 p-2" role="region" aria-label="Linkar para outra nota">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        autoFocus
                        value={query}
                        placeholder="Buscar nota por título ou matéria"
                        aria-label="Buscar nota para linkar"
                        className="h-8 pl-8 text-[0.8rem]"
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            // Dentro do diálogo, Enter enviaria o formulário da nota.
                            if (event.key === "Enter") {
                                event.preventDefault();
                                if (results[0]) applyLink(results[0]);
                            }
                            if (event.key === "Escape") {
                                event.stopPropagation();
                                onClose();
                            }
                        }}
                    />
                </div>
                {isOnLink ? (
                    <Button type="button" variant="ghost" size="sm" onClick={removeLink} title="Remover o link desta nota">
                        <Link2Off className="size-3.5" />
                        Remover link
                    </Button>
                ) : null}
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar">
                    <X className="size-3.5" />
                </Button>
            </div>

            <p className="px-0.5 text-xs text-muted-foreground">
                {hasSelection
                    ? "O texto selecionado vira um link para a nota escolhida."
                    : "Sem texto selecionado, o título da nota é inserido como link."}
            </p>

            <ul className="max-h-44 space-y-0.5 overflow-y-auto" aria-live="polite">
                {targets === null ? (
                    <li className="px-2 py-3 text-center text-xs text-muted-foreground">Carregando notas...</li>
                ) : results.length === 0 ? (
                    <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                        {targets.length <= 1 && !query
                            ? "Você ainda não tem outras notas para linkar."
                            : "Nenhuma nota encontrada."}
                    </li>
                ) : (
                    results.map((target) => (
                        <li key={target.id}>
                            <button
                                type="button"
                                onClick={() => applyLink(target)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-foreground/8 focus-visible:bg-foreground/8 focus-visible:outline-none"
                            >
                                <span
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: target.subjectColor }}
                                    aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1 truncate">{target.title}</span>
                                <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">
                                    {target.subjectTitle}
                                </span>
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

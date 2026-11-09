"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { NEW_ITEM_EVENT, type NewItemEventDetail } from "@/lib/shortcut-events";
import { Keyboard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

// Depois de "g", a próxima tecla escolhe a página.
const GO_TO: Record<string, { href: string; label: string }> = {
    d: { href: "/", label: "Dashboard" },
    m: { href: "/materias", label: "Matérias" },
    q: { href: "/kanban", label: "Quadro" },
    r: { href: "/revisoes", label: "Revisões" },
    c: { href: "/cronograma", label: "Cronograma" },
    n: { href: "/notas", label: "Anotações" },
    p: { href: "/desempenho", label: "Desempenho" },
    f: { href: "/flashcards", label: "Flashcards" },
};

const GO_TIMEOUT_MS = 1500;

type ShortcutGroup = { title: string; items: { keys: string[]; label: string }[] };

const GROUPS: ShortcutGroup[] = [
    {
        title: "Geral",
        items: [
            { keys: ["Ctrl", "K"], label: "Buscar matérias, assuntos e notas" },
            { keys: ["N"], label: "Novo assunto (na matéria aberta) ou nova matéria (na lista de Matérias)" },
            { keys: ["?"], label: "Mostrar esta lista" },
        ],
    },
    {
        title: "Ir para",
        items: Object.entries(GO_TO).map(([key, { label }]) => ({ keys: ["G", key.toUpperCase()], label })),
    },
    {
        title: "Revisões",
        items: [
            { keys: ["1"], label: "Muito difícil (com a avaliação aberta em “Feito”)" },
            { keys: ["2"], label: "Difícil" },
            { keys: ["3"], label: "Bom" },
            { keys: ["4"], label: "Fácil" },
        ],
    },
];

function isTypingTarget(target: EventTarget | null) {
    const element = target as HTMLElement | null;
    if (!element) return false;
    return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}

function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="min-w-6 rounded-md border border-(--glass-ring) bg-foreground/5 px-1.5 py-0.5 text-center text-xs font-medium">
            {children}
        </kbd>
    );
}

/** Atalhos globais de teclado (N, g + letra, ?) e o botão/diálogo com a lista. O Ctrl+K fica na busca global. */
export function KeyboardShortcuts() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const goPending = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearGo = () => {
            if (goPending.current) clearTimeout(goPending.current);
            goPending.current = null;
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
            if (isTypingTarget(event.target)) return;
            // Com um diálogo aberto (exceto a própria lista), as teclas pertencem a ele.
            if (!open && document.querySelector('[role="dialog"]')) return;

            if (event.key === "?") {
                event.preventDefault();
                setOpen((value) => !value);
                return;
            }

            if (open) return;

            const key = event.key.toLowerCase();

            if (goPending.current) {
                clearGo();
                const destination = GO_TO[key];
                if (destination) {
                    event.preventDefault();
                    router.push(destination.href);
                }
                return;
            }

            if (key === "g") {
                goPending.current = setTimeout(clearGo, GO_TIMEOUT_MS);
                return;
            }

            if (key === "n") {
                event.preventDefault();
                const detail: NewItemEventDetail = { handled: false };
                window.dispatchEvent(new CustomEvent<NewItemEventDetail>(NEW_ITEM_EVENT, { detail }));
                if (!detail.handled) {
                    toast("Abra uma matéria para adicionar um assunto (G e depois M).", { id: "shortcut-new-item", icon: "ℹ️" });
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            clearGo();
        };
    }, [open, router]);

    return (
        <>
            <Button
                variant="outline"
                size="icon"
                className="max-xl:hidden"
                onClick={() => setOpen(true)}
                aria-label="Atalhos de teclado (?)"
                title="Atalhos de teclado (?)"
            >
                <Keyboard />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Atalhos de teclado</DialogTitle>
                        <DialogDescription>Não funcionam enquanto você digita em um campo de texto.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        {GROUPS.map((group) => (
                            <section key={group.title} aria-label={group.title}>
                                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.title}</h3>
                                <ul className="grid gap-1.5">
                                    {group.items.map((item) => (
                                        <li key={item.label} className="flex items-center justify-between gap-3">
                                            <span className="min-w-0 text-sm">{item.label}</span>
                                            <span className="flex shrink-0 items-center gap-1">
                                                {item.keys.map((key, index) => (
                                                    <span key={key + index} className="flex items-center gap-1">
                                                        {index > 0 && <span className="text-xs text-muted-foreground">{group.title === "Ir para" ? "depois" : "+"}</span>}
                                                        <Kbd>{key}</Kbd>
                                                    </span>
                                                ))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

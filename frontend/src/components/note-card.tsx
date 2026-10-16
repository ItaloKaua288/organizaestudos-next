"use client"

import { OptionsNoteCard } from "@/components/options-note-card"
import { AttachmentThumb } from "@/components/note-attachments-field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatFileSize, openNoteAttachment } from "@/lib/note-attachments"
import { noteHref } from "@/lib/note-link-extension"
import { cn } from "@/lib/utils"
import type { Note } from "@/types/note"
import { Link2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import "@/components/notes.css"

interface NoteCardProps {
    note: Note
    subjectId: string
    /** HTML da nota, já sanitizado no servidor. */
    html: string
    tagSuggestions?: string[]
}

export function NoteCard({ note, subjectId, html, tagSuggestions }: NoteCardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const cardRef = useRef<HTMLDivElement>(null)

    const isTarget = searchParams.get("nota") === note.id
    const tags = note.tags ?? []
    const attachments = note.attachments ?? []
    const backlinks = note.backlinks ?? []

    // Chegou por um link de outra nota: leva o cartão para o meio da tela.
    useEffect(() => {
        if (!isTarget) return

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        cardRef.current?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" })
    }, [isTarget])

    const tagHref = (tag: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("nota")
        if (params.get("tag") === tag) params.delete("tag")
        else params.set("tag", tag)
        const query = params.toString()
        return `/notas/${subjectId}${query ? `?${query}` : ""}`
    }

    // Links entre notas navegam sem recarregar a página.
    const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-note-id]")
        if (!anchor) return

        const noteId = anchor.getAttribute("data-note-id")
        const targetSubject = anchor.getAttribute("data-subject-id")
        if (!noteId || !targetSubject) return

        // Ctrl/Cmd+clique continua abrindo em nova aba.
        if (event.metaKey || event.ctrlKey || event.shiftKey) return

        event.preventDefault()
        router.push(noteHref(targetSubject, noteId))
    }

    return (
        <Card
            ref={cardRef}
            id={`nota-${note.id}`}
            className={cn("flex flex-col justify-between scroll-mt-24", isTarget && "note-card-focus")}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="truncate" title={note.title}>
                    {note.title}
                </CardTitle>

                <OptionsNoteCard subjectId={subjectId} note={note} tagSuggestions={tagSuggestions} />
            </CardHeader>

            {tags.length > 0 ? (
                <CardContent className="-mt-1 flex flex-wrap gap-1.5" aria-label="Tags da nota">
                    {tags.map((tag) => (
                        <Link
                            key={tag}
                            href={tagHref(tag)}
                            scroll={false}
                            className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/22 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            title={`Filtrar pela tag ${tag}`}
                        >
                            #{tag}
                        </Link>
                    ))}
                </CardContent>
            ) : null}

            <CardContent
                className="prose prose-sm dark:prose-invert max-h-150 max-w-none overflow-y-auto"
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ __html: html }}
            />

            {attachments.length > 0 || backlinks.length > 0 ? (
                <CardContent className="space-y-3 border-t border-border/60 pt-4">
                    {attachments.length > 0 ? (
                        <ul className="flex flex-wrap gap-2" aria-label="Anexos da nota">
                            {attachments.map((attachment) => (
                                <li key={attachment.public_id} className="min-w-0 max-w-full">
                                    <button
                                        type="button"
                                        onClick={() => openNoteAttachment(note.id, attachment)}
                                        className="flex max-w-full items-center gap-2 rounded-xl border border-(--glass-ring) bg-(--glass-fill) py-1 pr-3 pl-1 text-left text-xs transition-colors hover:bg-(--glass-fill-strong) focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                        title={`Abrir ${attachment.name}`}
                                    >
                                        <AttachmentThumb attachment={attachment} />
                                        <span className="min-w-0">
                                            <span className="block max-w-48 truncate font-medium">{attachment.name}</span>
                                            <span className="block text-muted-foreground">{formatFileSize(attachment.size)}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {backlinks.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <Link2 className="size-3.5" aria-hidden="true" />
                                Mencionada em
                            </span>
                            {backlinks.map((backlink) => (
                                <Link
                                    key={backlink.id}
                                    href={noteHref(backlink.subjectId, backlink.id)}
                                    className="max-w-48 truncate rounded-full bg-foreground/6 px-2.5 py-0.5 font-medium text-foreground transition-colors hover:bg-foreground/12 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    {backlink.title}
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </CardContent>
            ) : null}
        </Card>
    )
}

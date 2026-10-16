import { getNotes } from "@/actions/notes.actions"
import { getSubjectsAction } from "@/actions/subjects.actions"
import { CreateNoteDialog } from "@/components/Create-note-dialog"
import { NoteCard } from "@/components/note-card"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import DOMPurify from "isomorphic-dompurify"
import { CornerDownLeft } from "lucide-react"
import Link from "next/link"
import { CloseRedirectToast } from "./components/CloseRedirectToast"
import { SearchNotes } from "./components/search-notes"


export default async function NotasOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string, tag?: string, nota?: string }> }) {
    const { id } = await params
    const { q, tag, nota } = await searchParams

    const subjects = await getSubjectsAction()
    const subject = subjects.find((item) => item.id === id)

    if (!subject || subject.active === false) {
        return (
            <main className="introduction-Page flex flex-col items-start">
                <CloseRedirectToast />
                <PageHeader
                    title="Anotações"
                    description={subject ? "Esta matéria está desativada. Reative-a em Matérias para ver e criar anotações." : "Matéria não encontrada."}
                />
                <Link href="/notas" className={buttonVariants({ variant: "outline" })}>
                    <CornerDownLeft className="size-4" />
                    Voltar
                </Link>
            </main>
        )
    }

    const allNotas = await getNotes(id)

    // Todas as tags da matéria, da mais usada para a menos usada.
    const tagCounts = new Map<string, number>()
    for (const note of allNotas) {
        for (const noteTag of note.tags ?? []) {
            tagCounts.set(noteTag, (tagCounts.get(noteTag) ?? 0) + 1)
        }
    }
    const allTags = [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
        .map(([name, count]) => ({ name, count }))

    const query = q?.toLowerCase() || ""
    const activeTag = tag && tagCounts.has(tag) ? tag : undefined

    const filteredNotas = allNotas.filter((note) => {
        // Vindo de um link entre notas (?nota=), a nota de destino sempre aparece.
        if (nota && note.id === nota) return true

        if (activeTag && !(note.tags ?? []).includes(activeTag)) return false

        if (!query) return true

        return (
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query) ||
            (note.tags ?? []).some((noteTag) => noteTag.includes(query.replace(/^#/, "")))
        )
    }).sort((a, b) => {
        const aPinned = a.is_pined ? 1 : 0;
        const bPinned = b.is_pined ? 1 : 0;

        return bPinned - aPinned;
    })

    // Mantém a busca ao trocar de tag (e vice-versa).
    const tagHref = (name?: string) => {
        const params = new URLSearchParams()
        if (q) params.set("q", q)
        if (name) params.set("tag", name)
        const qs = params.toString()
        return `/notas/${id}${qs ? `?${qs}` : ""}`
    }

    return (
        <main className="introduction-Page flex flex-col">
            <CloseRedirectToast />
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} aria-hidden="true" />
                        <span className="min-w-0 truncate">{subject.title}</span>
                    </span>
                }
                description="Gerencie as anotações desta matéria."
                actions={
                    <>
                        <Link href="/notas" className={buttonVariants({ variant: "outline", size: "sm" })}>
                            <CornerDownLeft className="size-4" />
                            Voltar
                        </Link>
                        <SearchNotes />
                        <CreateNoteDialog subjectId={id} tagSuggestions={allTags.map((item) => item.name)} />
                    </>
                }
            />

            {allTags.length > 0 ? (
                <nav aria-label="Filtrar por tag" className="-mt-2 mb-5 flex flex-wrap items-center gap-2">
                    <Link
                        href={tagHref()}
                        scroll={false}
                        aria-current={!activeTag ? "true" : undefined}
                        className={cn(
                            "rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                            !activeTag ? "bg-primary text-primary-foreground" : "bg-foreground/6 hover:bg-foreground/12"
                        )}
                    >
                        Todas <span className="opacity-70">{allNotas.length}</span>
                    </Link>
                    {allTags.map((item) => (
                        <Link
                            key={item.name}
                            href={tagHref(item.name)}
                            scroll={false}
                            aria-current={activeTag === item.name ? "true" : undefined}
                            className={cn(
                                "rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                                activeTag === item.name ? "bg-primary text-primary-foreground" : "bg-foreground/6 hover:bg-foreground/12"
                            )}
                        >
                            #{item.name} <span className="opacity-70">{item.count}</span>
                        </Link>
                    ))}
                </nav>
            ) : null}

            <section aria-label="Listagem de anotações">
                {allNotas.length === 0 ? (
                    <div className="glass rounded-2xl px-6 py-12 text-center">
                        <p className="font-medium">Nenhuma nota nesta matéria</p>
                        <p className="mt-1 text-sm text-muted-foreground">Use Nova nota para criar a primeira.</p>
                    </div>
                ) : filteredNotas.length === 0 ? (
                    <div className="glass rounded-2xl px-6 py-12 text-center">
                        <p className="font-medium">
                            {activeTag && !q ? `Nenhuma nota com a tag #${activeTag}` : `Nada encontrado para “${q ?? ""}”`}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {activeTag ? "Escolha outra tag ou limpe o filtro." : "Tente outro termo de busca."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {filteredNotas.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                subjectId={id}
                                html={DOMPurify.sanitize(note.content)}
                                tagSuggestions={allTags.map((item) => item.name)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

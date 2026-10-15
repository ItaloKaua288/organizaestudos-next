import { getNotes } from "@/actions/notes.actions"
import { getSubjectsAction } from "@/actions/subjects.actions"
import { CreateNoteDialog } from "@/components/Create-note-dialog"
import { OptionsNoteCard } from "@/components/options-note-card"
import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DOMPurify from "isomorphic-dompurify"
import { CornerDownLeft } from "lucide-react"
import Link from "next/link"
import { CloseRedirectToast } from "./components/CloseRedirectToast"
import { SearchNotes } from "./components/search-notes"


export default async function NotasOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string }> }) {
    const { id } = await params
    const { q } = await searchParams

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

    const query = q?.toLowerCase() || ""
    const filteredNotas = allNotas.filter((note) => {
        if (!query) return true

        return (
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        )
    }).sort((a, b) => {
        const aPinned = a.is_pined ? 1 : 0;
        const bPinned = b.is_pined ? 1 : 0;

        return bPinned - aPinned;
    })

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
                        <CreateNoteDialog subjectId={id} />
                    </>
                }
            />

            <section aria-label="Listagem de anotações">
                {allNotas.length === 0 ? (
                    <div className="glass rounded-2xl px-6 py-12 text-center">
                        <p className="font-medium">Nenhuma nota nesta matéria</p>
                        <p className="mt-1 text-sm text-muted-foreground">Use Nova nota para criar a primeira.</p>
                    </div>
                ) : filteredNotas.length === 0 ? (
                    <div className="glass rounded-2xl px-6 py-12 text-center">
                        <p className="font-medium">Nada encontrado para “{q}”</p>
                        <p className="mt-1 text-sm text-muted-foreground">Tente outro termo de busca.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {filteredNotas.map((note) => {
                            const cleanHTML = DOMPurify.sanitize(note.content)

                            return (
                                <Card key={note.id} className="flex flex-col justify-between">
                                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                                        <CardTitle className="truncate" title={note.title}>
                                            {note.title}
                                        </CardTitle>

                                        <OptionsNoteCard subjectId={id} note={note} />
                                    </CardHeader>

                                    <CardContent
                                        className="prose prose-sm dark:prose-invert max-h-150 max-w-none overflow-y-auto"
                                        dangerouslySetInnerHTML={{ __html: cleanHTML }}
                                    />
                                </Card>
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )
}

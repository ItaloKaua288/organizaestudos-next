import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotes } from "@/services/notes.service"
import { Note } from "@/types/note"
import { CornerDownLeft } from "lucide-react"
import Link from "next/link"
import { CreateNoteDialog } from "./components/Create-note-dialog"
import { OptionsNoteCard } from "./components/options-note-card"
import { SearchNotes } from "./components/search-notes"


export default async function NotasOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string }> }) {
    const { id } = await params
    const { q } = await searchParams
    let allNotas: Note[] = []

    try {
        allNotas = await getNotes(id)
    } catch (error) {
        console.error("Erro ao carregar anotações:", error)
    }

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
        <main className="space-y-4">
            <header className="flexspace-y-1">
                <h1 className="bg-card py-2 px-2 text-xl font-bold shadow-sm">
                    Anotações
                </h1>
                <p className="p-2 text-sm font-medium text-muted-foreground">
                    Gerencie suas anotações para esta matéria.
                </p>

                {/* Barra de ferramentas e navegação */}
                <nav aria-label="Ações das anotações" className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                    <Button variant="outline" >
                        <Link href="/notas" className="flex items-center gap-2 w-full sm:w-auto">
                            <CornerDownLeft className="h-4 w-4" />
                            <span>Voltar</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <SearchNotes />
                        </div>
                        <CreateNoteDialog subjectId={id} />
                    </div>
                </nav>
            </header>

            <section aria-label="Listagem de Anotações" className="px-2">
                {allNotas.length === 0 ? (
                    <p className="py-12 text-sm text-muted-foreground text-center border rounded-lg bg-muted/20">
                        Nenhuma nota encontrada para esta matéria.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredNotas.map((note) => (
                            <Card key={note.id} className="flex flex-col justify-between">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                                    <CardTitle className="truncate text-base font-semibold" title={note.title}>
                                        {note.title}
                                    </CardTitle>

                                    <OptionsNoteCard subjectId={id} note={note} />
                                </CardHeader>

                                <CardContent
                                    className="prose prose-sm dark:prose-invert max-w-none pt-2 max-h-150 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </main >
    )
}
"use client"

import { Note } from "@/types/topic"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldGroup, Field } from "@/components/ui/field"
import { DialogDemo } from "@/components/dialog-button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CornerDownLeft, Search, Plus, Pin, PencilLine, Trash2 } from "lucide-react"

import { RichTextEditor } from "@/components/rich-text-editor"

const exempleApiResponse = {
    "success": true,
    "notes": [
        {
            "_id": "6a3ef91724e7ac2d794e151b",
            "title": "Se Então (P -> Q)",
            "content": "<ul><li><b>Negação:</b> P ^ ~Q (Mané = Mantém a primeira e nega a segunda)</li><li><b style=\"color: oklab(0.8487 0 0 / 0.9);\">Equivalencia:</b><span style=\"color: oklab(0.8487 0 0 / 0.9);\">&nbsp;\n\n<!--StartFragment-->~Q<!--EndFragment-->&nbsp;&nbsp;-&gt;<!--EndFragment-->&nbsp;~P / ~P V Q (Neymar = Nega a primeira OU mantem a segunda)</span></li></ul>",
            "user_id": "6a2ee3ee63fe8e34b7fa9e60",
            "isPinned": false,
            "matter_id": {
                "_id": "6a2ee40263fe8e34b7fa9e6c",
                "title": "Raciocinio Logico",
                "user_id": "6a2ee3ee63fe8e34b7fa9e60",
                "color": "#05df72",
                "createdAt": "2026-06-14T17:25:22.501Z",
                "updatedAt": "2026-06-14T17:25:22.501Z",
                "__v": 0
            },
            "createdAt": "2026-06-26T22:11:35.642Z",
            "updatedAt": "2026-06-26T22:47:02.645Z",
            "__v": 0
        },
        {
            "_id": "6a3efa8824e7ac2d794e151f",
            "title": "U (OU)",
            "content": "<ul><li><b>Negação:</b>&nbsp;P U Q, fica ~P V ~Q</li><li><b>Equivalencia: </b>P V Q, fica ~P -&gt; Q</li><li><b>Equivalencia: </b>P V Q, fica ~P -&gt; Q</li><li><b>Equivalencia: </b>P V Q, fica ~P -&gt; Q</li></ul>",
            "user_id": "6a2ee3ee63fe8e34b7fa9e60",
            "isPinned": false,
            "matter_id": {
                "_id": "6a2ee40263fe8e34b7fa9e6c",
                "title": "Raciocinio Logico",
                "user_id": "6a2ee3ee63fe8e34b7fa9e60",
                "color": "#05df72",
                "createdAt": "2026-06-14T17:25:22.501Z",
                "updatedAt": "2026-06-14T17:25:22.501Z",
                "__v": 0
            },
            "createdAt": "2026-06-26T22:17:44.832Z",
            "updatedAt": "2026-06-26T22:23:35.678Z",
            "__v": 0
        },
        {
            "_id": "6a3efdec24e7ac2d794e1526",
            "title": "Bicondicional (<->)",
            "content": "<ul><li><b>Negação: </b>2 formas: Usa Ou e Ou ( P V Q) ou&nbsp;\n(P ^ ~Q) V (~P ^ Q)<!--EndFragment--></li><li><b>Equivalencia: </b>Para ser equivalente é necessário dois Se...Então. P &lt;-&gt; Q, fica (P -&gt; Q) ^ (Q -&gt; P)</li></ul>",
            "user_id": "6a2ee3ee63fe8e34b7fa9e60",
            "isPinned": false,
            "matter_id": {
                "_id": "6a2ee40263fe8e34b7fa9e6c",
                "title": "Raciocinio Logico",
                "user_id": "6a2ee3ee63fe8e34b7fa9e60",
                "color": "#05df72",
                "createdAt": "2026-06-14T17:25:22.501Z",
                "updatedAt": "2026-06-14T17:25:22.501Z",
                "__v": 0
            },
            "createdAt": "2026-06-26T22:32:12.229Z",
            "updatedAt": "2026-06-26T22:36:32.060Z",
            "__v": 0
        }
    ]
}

async function getNotes() {
    try {
        // const res = await fetch("URL", { next: { revalidate: 3600 }})
        // if (!res.ok) throw new Error("Falha ao buscar as anotações")
        // const data = await res.json()

        return exempleApiResponse.notes.map<Note>((note) => ({
            id: note._id,
            title: note.title,
            content: note.content,
            is_pined: note.isPinned,
            subject: {
                id: note.matter_id._id,
                title: note.matter_id.title,
                color: note.matter_id.color
            }
        }))
    } catch (error) {
        console.error("Erro ao buscar as anotações", error)
        return []
    }
}

export default function NotasOverviewPage() {
    const [notes, setNotes] = useState<Note[]>([])
    const [conteudo, setConteudo] = useState("")

    useEffect(() => {
        async function loadNotes() {
            const data = await getNotes()
            setNotes(data)
        }
        loadNotes()
    }, [])

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
                    <Button variant="outline" render={
                        <Link href="/notas" className="flex items-center gap-2 w-full sm:w-auto">
                            <CornerDownLeft className="h-4 w-4" />
                            <span>Voltar</span>
                        </Link>
                    } />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar Nota..."
                                className="pl-8"
                            />
                        </div>

                        <DialogDemo
                            contentBtn={
                                <span className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span>Nova Nota</span>
                                </span>
                            }
                            title="Nova Nota"
                            description="Crie uma nova nota para sua matéria"
                        >
                            <FieldGroup >
                                <Field className="space-y-2">
                                    <Label htmlFor="title-input">Título:</Label>
                                    <Input id="title-input" placeholder="Ex: Equivalência Lógica" required />
                                </Field>

                                <Field className="space-y-2">
                                    <Label htmlFor="content-editor">Anotação:</Label>
                                    <div id="content-editor">
                                        <RichTextEditor
                                            value={conteudo}
                                            onChange={setConteudo}
                                        />
                                    </div>
                                </Field>
                            </FieldGroup>
                        </DialogDemo>
                    </div>
                </nav>
            </header>

            <section aria-label="Listagem de Anotações" className="px-2">
                {notes.length === 0 ? (
                    <p className="py-12 text-sm text-muted-foreground text-center border rounded-lg bg-muted/20">
                        Nenhuma nota encontrada para esta matéria.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {notes.map((note) => (
                            <Card key={note.id} className="flex flex-col justify-between">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                                    <CardTitle className="truncate text-base font-semibold" title={note.title}>
                                        {note.title}
                                    </CardTitle>

                                    <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Ações da nota">
                                        <Button variant="ghost" size="icon" title="Fixar nota">
                                            <Pin className="h-4 w-4" />
                                            <span className="sr-only">Fixar nota {note.title}</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Editar nota">
                                            <PencilLine className="h-4 w-4" />
                                            <span className="sr-only">Editar nota {note.title}</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir nota">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Excluir nota {note.title}</span>
                                        </Button>
                                    </div>
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
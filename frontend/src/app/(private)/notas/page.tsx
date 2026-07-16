import { Subject } from "@/types/topic"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const exempleApiResponse = {
    "success": true,
    "matters": [
        {
            "_id": "6a2ee3f863fe8e34b7fa9e68",
            "title": "Portugues",
            "user_id": "6a2ee3ee63fe8e34b7fa9e60",
            "color": "#ff6467",
            "createdAt": "2026-06-14T17:25:12.510Z",
            "updatedAt": "2026-06-14T17:25:12.510Z",
            "__v": 0
        },
        {
            "_id": "6a2ee40263fe8e34b7fa9e6c",
            "title": "Raciocinio Logico",
            "user_id": "6a2ee3ee63fe8e34b7fa9e60",
            "color": "#05df72",
            "createdAt": "2026-06-14T17:25:22.501Z",
            "updatedAt": "2026-06-14T17:25:22.501Z",
            "__v": 0
        },
        {
            "_id": "6a333f9f660406f94f04d3e2",
            "title": "Noções de Informática",
            "user_id": "6a2ee3ee63fe8e34b7fa9e60",
            "color": "#ff8904",
            "createdAt": "2026-06-18T00:45:19.434Z",
            "updatedAt": "2026-06-18T00:45:24.883Z",
            "__v": 0
        }
    ]
}

async function getSubjects(): Promise<Subject[]> {
    try {
        // const res = await fetch("https://api.exemplo.com/matters", { next: { revalidate: 3600 } })
        // if (!res.ok) throw new Error("Falha ao buscar matérias")
        //    const data = await res.json()

        return exempleApiResponse.matters.map((subject) => ({
            id: subject._id,
            title: subject.title,
            color: subject.color
        }))
    } catch (error) {
        console.error("Erro ao buscar matérias:", error)
        return []
    }
}

export default async function NotasPage() {
    const subjects = await getSubjects()

    return (
        <div className="space-y-4">
            <header className="space-y-1">
                <h1 className="bg-card py-2 px-2 text-xl font-bold shadow-sm">
                    Anotações
                </h1>
                <p className="px-2 text-sm font-medium text-muted-foreground">
                    Gerencie suas anotações de cada matéria.
                </p>
            </header>

            {subjects.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                    Nenhuma matéria encontrada.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {subjects.map((subject) => (
                        <Button
                            key={subject.id}
                            variant="outline"
                            className="h-auto justify-start p-6"
                        >
                            <Link href={`/notas/${subject.id}`} className="flex gap-2 items-center" >
                                <span
                                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                                    style={{ backgroundColor: subject.color }}
                                    aria-hidden="true"
                                />
                                <span className="truncate font-medium">{subject.title}</span>
                            </Link>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
};
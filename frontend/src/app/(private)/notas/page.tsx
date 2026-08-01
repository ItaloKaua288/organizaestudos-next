import { Button } from "@/components/ui/button"
import { getSubjects } from "@/services/subjects.service"
import { Subject } from "@/types/subject"
import Link from "next/link"

export default async function NotasPage() {
    let allSubjects: Subject[] = []

    try {
        allSubjects = await getSubjects()
    } catch (error) {
        console.error("Erro ao carregar anotações:", error)
    }

    return (
        <div className="space-y-4">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    Anotações
                </h1>
                <p className="p-2 text-sm font-medium text-muted-foreground">
                    Gerencie suas anotações de cada matéria.
                </p>
            </header>

            {allSubjects.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                    Nenhuma matéria encontrada.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-2 p-2 pt-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {allSubjects.map((subject) => (
                        <Button
                            key={subject.id}
                            variant="outline"
                            className="h-auto justify-start p-6 antiTransparenceBtn"
                            nativeButton={false}
                            render={
                                <Link href={`/notas/${subject.id}`} className="flex gap-2 items-center" >
                                    <span
                                        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                                        style={{ backgroundColor: subject.color }}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate font-medium">{subject.title}</span>
                                </Link>
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
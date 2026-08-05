import { Button } from "@/components/ui/button"
import { getSubjects } from "@/services/subjects.service"
import { Subject } from "@/types/subject"
import Link from "next/link"
import { ScrambleText } from "@/components/scramble-text";

export default async function NotasPage() {
    let allSubjects: Subject[] = []

    try {
        allSubjects = await getSubjects()
    } catch (error) {
        console.error("Erro ao carregar anotações:", error)
    }

    return (
        <div className="space-y-4">
            <header className=" relative space-y-1 z-9">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm ">
                    <ScrambleText text="ANOTAÇÕES" />
                </h1>
            </header>

            <section className=" z-5">

                {allSubjects.length === 0 ? (
                    <p className="p-2 text-sm text-muted-foreground">
                        Nenhuma matéria encontrada.
                    </p>
                ) : (
                    <>
                        <p className="p-2 py-4 font-medium text-sm text-muted-foreground pt-0">
                            Visualize suas revisões. Elas são espaçadas entre 24 horas, 7 dias e 30 dias.
                        </p>
                        <div className="grid grid-cols-1 gap-2 p-2 pt-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {allSubjects.map((subject, index) => (
                                <Button
                                    key={subject.id}
                                    variant="outline"
                                    className="h-auto justify-start p-6 antiTransparenceBtn introduction-card"
                                    nativeButton={false}
                                    style={{ animationDelay: `${index * 150}ms` }}
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
                    </>
                )}
            </section>
        </div>
    )
}
import { getSubjectsAction } from "@/actions/subjects.actions";
import { ScrambleText } from "@/components/scramble-text";
import { RedirectButton } from "./components/button-redirect";

export default async function NotasPage() {
    const allSubjects = await getSubjectsAction()

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
                            Visualize suas notas.
                        </p>
                        <div className="grid grid-cols-1 gap-2 p-2 pt-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {allSubjects.map((subject, index) => (
                                <RedirectButton
                                    key={subject.id}
                                    subject={subject}
                                    index={index}
                                />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}
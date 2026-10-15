import { getSubjectsAction } from "@/actions/subjects.actions";
import { PageHeader } from "@/components/page-header";
import { RedirectButton } from "./components/button-redirect";

export default async function NotasPage() {
    const allSubjects = (await getSubjectsAction()).filter((subject) => subject.active !== false)

    return (
        <div className="introduction-Page flex flex-col">
            <PageHeader title="Anotações" description="Escolha uma matéria para ver e criar notas." />

            <section>
                {allSubjects.length === 0 ? (
                    <div className="glass rounded-2xl px-6 py-12 text-center">
                        <p className="font-medium">Nenhuma matéria encontrada</p>
                        <p className="mt-1 text-sm text-muted-foreground">Crie uma matéria para começar a anotar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {allSubjects.map((subject, index) => (
                            <RedirectButton
                                key={subject.id}
                                subject={subject}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

import { getNotesOverviewAction } from "@/actions/notes.actions";
import { getSubjectsAction } from "@/actions/subjects.actions";
import { PageHeader } from "@/components/page-header";
import { formatRelativeTime } from "@/lib/relative-time";
import { NotesHome, type RecentNoteCard, type SubjectCard } from "./components/notes-home";
import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Anotações",
};

export default async function NotasPage() {
    const [subjects, overview] = await Promise.all([getSubjectsAction(), getNotesOverviewAction()]);
    const allSubjects = subjects.filter((subject) => subject.active !== false)

    const summaryBySubject = new Map(overview.subjects.map((item) => [item.subjectId, item]))
    const now = new Date()

    const cards: SubjectCard[] = allSubjects.map((subject) => {
        const item = summaryBySubject.get(subject.id)

        return {
            ...subject,
            summary: {
                count: item?.count ?? 0,
                pinned: item?.pinned ?? 0,
                attachments: item?.attachments ?? 0,
                lastLabel: formatRelativeTime(item?.lastUpdatedAt, now),
            },
        }
    })

    // Só notas de matérias que aparecem na página (ativas e do perfil atual).
    const subjectIds = new Set(allSubjects.map((subject) => subject.id))
    const recent: RecentNoteCard[] = overview.recent
        .filter((note) => subjectIds.has(note.subjectId))
        .map((note) => ({ ...note, label: formatRelativeTime(note.updatedAt, now) }))

    return (
        <div className="introduction-Page flex flex-col">
            <PageHeader title="Anotações" description="Resumos, links e anexos livres, organizados por matéria. Escolha uma matéria para ver e criar notas. O andamento dos assuntos fica em Matérias e no Quadro." />

            <section>
                {allSubjects.length === 0 ? (
                    <div className="glass rounded-2xl px-6 py-12 text-center">
                        <p className="font-medium">Nenhuma matéria encontrada</p>
                        <p className="mt-1 text-sm text-muted-foreground">Crie uma matéria para começar a anotar.</p>
                    </div>
                ) : (
                    <NotesHome subjects={cards} recent={recent} />
                )}
            </section>
        </div>
    )
}

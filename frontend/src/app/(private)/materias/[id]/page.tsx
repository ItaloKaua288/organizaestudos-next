import { getDetailSubjectAction } from "@/actions/subjects.actions";
import { CreateNoteDialog } from "@/components/Create-note-dialog";
import { OptionsNoteCard } from "@/components/options-note-card";
import ProgressLabelDemo from "@/components/progress-label";
import { ReviewSection } from "@/components/reviewSection";
import ScrambleText from "@/components/scramble-text";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayBR } from "@/lib/date";
import { Topic } from "@/types/topic";
import DOMPurify from "isomorphic-dompurify";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { CreateTopicForm } from "./components/create-topic-form";
import { TopicList } from "./components/topic-list";

export default async function DetailMateriaPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;

    const resolvedSearchParams = await searchParams;
    const tab = resolvedSearchParams.tab || "assuntos";

    const subject = await getDetailSubjectAction(id);

    if (!subject) {
        return <div className="p-8 text-white">Matéria não encontrada.</div>;
    }

    const sortedNotes = subject.notes?.sort((a, b) => {
        const aPinned = a.is_pined ? 1 : 0;
        const bPinned = b.is_pined ? 1 : 0;

        return bPinned - aPinned;
    })

    const totalTopics = subject.topics?.length || 0;
    const completedTopics = subject.topics?.filter(t => t.status === 'CONCLUIDO').length || 0;
    const progressPercentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
    const sortedTopics = subject.topics ? [...subject.topics].sort((a, b) => a.order - b.order) : [];

    const allReviews: { topicTitle: string; reviewType: string; date: string; concluded: boolean; status: boolean }[] = [];
    subject.topics?.forEach(topic => {
        if (topic.reviews) {
            allReviews.push({ topicTitle: topic.title, reviewType: 'R1', date: topic.reviews.first.date, concluded: topic.reviews.first.concluded, status: topic.status === "CONCLUIDO" });
            allReviews.push({ topicTitle: topic.title, reviewType: 'R2', date: topic.reviews.second.date, concluded: topic.reviews.second.concluded, status: topic.status === "CONCLUIDO" });
            allReviews.push({ topicTitle: topic.title, reviewType: 'R3', date: topic.reviews.third.date, concluded: topic.reviews.third.concluded, status: topic.status === "CONCLUIDO" });
        }
    });

    const activeTabStyle = "pb-3 border-b-2 border-primary text-primary font-medium text-sm transition";
    const inactiveTabStyle = "pb-3 border-b-2 border-transparent hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 font-medium text-sm transition";

    const now = getTodayBR();

    const sortReviews = (topicsList: Topic[], reviewKey: "first" | "second" | "third") => {
        return [...topicsList].sort((a, b) => {
            const aDate = new Date(a.reviews[reviewKey].date);
            const bDate = new Date(b.reviews[reviewKey].date);

            const aLate = aDate < now;
            const bLate = bDate < now;

            if (aLate !== bLate) {
                return aLate ? -1 : 1;
            }
            return aDate.getTime() - bDate.getTime();
        });
    };

    const concludedTopics = sortedTopics.filter(topic => topic.status === "CONCLUIDO")
    const topicTimes = {
        concluded: concludedTopics.filter(
            topic =>
                topic.reviews.first.concluded ||
                topic.reviews.second.concluded ||
                topic.reviews.third.concluded
        ),
        day: sortReviews(
            concludedTopics.filter(topic => !topic.reviews.first.concluded),
            "first"
        ),
        week: sortReviews(
            concludedTopics.filter(topic => !topic.reviews.second.concluded),
            "second"
        ),
        month: sortReviews(
            concludedTopics.filter(topic => !topic.reviews.third.concluded),
            "third"
        ),
    };

    const timelineDays = subject.timelines?.map((timeline) => timeline.day)

    const sections = [
        { title: "24 horas", reviewIndex: 1, icon: <Clock size={20} />, topics: topicTimes.day },
        { title: "7 dias", reviewIndex: 2, icon: <Clock size={20} />, topics: topicTimes.week },
        { title: "30 dias", reviewIndex: 3, icon: <Clock size={20} />, topics: topicTimes.month },
        { title: "Concluído", icon: <CheckCircle2 size={20} className="text-green-500" />, topics: topicTimes.concluded },
    ];

    return (
        <main>
            <h1 className="px-2 py-4 text-xl font-bold shadow-sm bg-card z-9 mb-8">
                <ScrambleText text="Detalhes da matéria" />
            </h1>
            <section className="flex flex-col p-2 gap-6">
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className="h-7 w-7 shrink-0 rounded-full"
                                style={{ backgroundColor: subject.color || "#ccc" }}
                                aria-hidden="true"
                            />
                            <CardTitle className="text-2xl">{subject.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ProgressLabelDemo label="Progresso de conclusão" value={Number(progressPercentage.toFixed(2))} description="dos assuntos concluídos" />
                    </CardContent>
                </Card>

                <div className="flex gap-8 border-b-2">
                    <Link href="?tab=assuntos" className={tab === 'assuntos' ? activeTabStyle : inactiveTabStyle}>
                        Assuntos <Badge className="px-1 py-2.5" variant="secondary">{subject.topics?.length}</Badge>
                    </Link>
                    <Link href="?tab=notas" className={tab === 'notas' ? activeTabStyle : inactiveTabStyle}>
                        Notas <Badge className="px-1 py-2.5" variant="secondary">{subject.notes?.length}</Badge>
                    </Link>
                    <Link href="?tab=revisoes" className={tab === 'revisoes' ? activeTabStyle : inactiveTabStyle}>
                        Revisões <Badge className="px-1 py-2.5" variant="secondary">{allReviews.filter(r => !r.concluded && r.status).length}</Badge>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {tab === 'assuntos' && (
                        < div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-card p-2 rounded-lg border col-span-1 md:col-span-3">
                            <TopicList sortedTopics={sortedTopics} subject={subject} />
                            <CreateTopicForm subjectId={subject.id} />
                        </div>
                    )}

                    {tab === 'notas' && (
                        < div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 col-span-1 md:col-span-3">
                            <div className="flex items-center justify-end mb-4">
                                <CreateNoteDialog subjectId={id} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {sortedNotes && sortedNotes.length > 0 ? (
                                    sortedNotes.map(note => {
                                        const cleanHTML = DOMPurify.sanitize(note.content);

                                        return (
                                            <Card key={note.id} className="flex flex-col justify-between">
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-3">
                                                    <CardTitle className="truncate text-base font-semibold" title={note.title}>
                                                        {note.title}
                                                    </CardTitle>
                                                    <OptionsNoteCard key={note.id} subjectId={subject.id} note={note}></OptionsNoteCard>
                                                </CardHeader>

                                                <CardContent
                                                    className="prose prose-sm dark:prose-invert max-w-none pt-2 max-h-150 overflow-y-auto"
                                                    dangerouslySetInnerHTML={{ __html: cleanHTML }}
                                                />
                                            </Card>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-zinc-500 col-span-1 md:col-span-3">Nenhuma nota encontrada para esta matéria.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'revisoes' && (
                        < div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full flex flex-col gap-3 col-span-1 md:col-span-3">
                            {sections.map((sec, index) => (
                                <ReviewSection
                                    key={index}
                                    title={sec.title}
                                    reviewIndex={sec.reviewIndex!}
                                    icon={sec.icon}
                                    topics={sec.topics}
                                />
                            ))}
                        </div>
                    )
                    }

                    <div className="flex flex-col gap-4 col-span-1 md:pr-2">
                        <Card className="introduction-card w-full" style={{ animationDelay: `${1 * 150}ms` }} >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold flex items-center justify-between gap-2">Cronograma <CalendarClock /></CardTitle>
                                <span className="text-xs text-input">Dias da semana em que a matéria está vinculada no cronograma</span>
                            </CardHeader>
                            <CardContent className="flex gap-2 justify-center pt-0 flex-wrap">
                                {timelineDays ? (
                                    <>
                                        {timelineDays.map((day) => (
                                            <Badge key={day} className="p-3.5" variant={"secondary"}>{day}</Badge>
                                        ))}
                                    </>

                                ) : (
                                    <p>Sem dias vinculados.</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="introduction-card w-full" style={{ animationDelay: `${2 * 150}ms` }} >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Calendário</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center pt-0">
                                <Calendar
                                    className="rounded-xl border p-3 max-w-65 w-full"
                                    classNames={{
                                        today: "rounded-md bg-primary text-primary-foreground font-semibold",
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div >
            </section >
        </main >
    );
}

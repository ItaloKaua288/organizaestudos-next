import { getDetailSubjectAction } from "@/actions/subjects.actions";
import { CreateNoteDialog } from "@/components/Create-note-dialog";
import { OptionsNoteCard } from "@/components/options-note-card";
import ProgressLabelDemo from "@/components/progress-label";
import { ReviewSection } from "@/components/reviewSection";
import { SubjectActiveToggle } from "@/components/subject-active-toggle";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayBR } from "@/lib/date";
import { TOPIC_TITLE_SEPARATOR, withoutContainers } from "@/lib/topic-tree";
import { Topic } from "@/types/topic";
import DOMPurify from "isomorphic-dompurify";
import { CalendarClock, CheckCircle2, Clock, CornerDownLeft } from "lucide-react";
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
        return (
            <main className="introduction-Page flex flex-col items-start gap-4">
                <PageHeader title="Matéria não encontrada" description="Ela pode ter sido removida ou o link está incorreto." />
                <Link href="/materias" className={buttonVariants({ variant: "outline" })}>
                    <CornerDownLeft /> Voltar para matérias
                </Link>
            </main>
        );
    }

    if (subject.active === false) {
        return (
            <main className="introduction-Page flex flex-col gap-4">
                <PageHeader title="Detalhes da matéria" />
                <Card className="border-dashed">
                    <CardHeader className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3 opacity-70">
                            <span
                                className="size-4 shrink-0 rounded-full"
                                style={{ backgroundColor: subject.color || "#ccc" }}
                                aria-hidden="true"
                            />
                            <CardTitle className="truncate text-2xl">{subject.title}</CardTitle>
                            <Badge variant="secondary">Desativada</Badge>
                        </div>
                        <SubjectActiveToggle subjectId={subject.id} active={false} />
                    </CardHeader>
                    <CardContent>
                        <p className="max-w-prose text-sm text-muted-foreground">
                            Esta matéria está desativada: assuntos, notas, revisões e cronograma ficam ocultos e não podem ser alterados. Nada foi apagado, ao reativar tudo volta como estava.
                        </p>
                    </CardContent>
                </Card>
                <Link href="/materias" className={buttonVariants({ variant: "outline", className: "self-start" })}>
                    <CornerDownLeft /> Voltar para matérias
                </Link>
            </main>
        );
    }

    const sortedNotes = subject.notes?.sort((a, b) => {
        const aPinned = a.is_pined ? 1 : 0;
        const bPinned = b.is_pined ? 1 : 0;

        return bPinned - aPinned;
    })

    // Assuntos com subassuntos são só organizadores: não contam no progresso nem nas revisões.
    const countableTopics = withoutContainers(subject.topics ?? []);
    const totalTopics = countableTopics.length;
    const completedTopics = countableTopics.filter(t => t.status === 'CONCLUIDO').length;
    const progressPercentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
    const sortedTopics = subject.topics ? [...subject.topics].sort((a, b) => a.order - b.order) : [];

    const allReviews: { topicTitle: string; reviewType: string; date: string; concluded: boolean; status: boolean }[] = [];
    countableTopics.forEach(topic => {
        if (topic.reviews) {
            allReviews.push({ topicTitle: topic.title, reviewType: 'R1', date: topic.reviews.first.date, concluded: topic.reviews.first.concluded, status: topic.status === "CONCLUIDO" });
            allReviews.push({ topicTitle: topic.title, reviewType: 'R2', date: topic.reviews.second.date, concluded: topic.reviews.second.concluded, status: topic.status === "CONCLUIDO" });
            allReviews.push({ topicTitle: topic.title, reviewType: 'R3', date: topic.reviews.third.date, concluded: topic.reviews.third.concluded, status: topic.status === "CONCLUIDO" });
        }
    });

    const tabBase = "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none";
    const activeTabStyle = `${tabBase} bg-(--glass-fill-strong) text-foreground shadow-[inset_0_1px_0_var(--glass-edge),0_0_0_1px_var(--glass-ring)]`;
    const inactiveTabStyle = `${tabBase} text-muted-foreground hover:bg-foreground/6 hover:text-foreground`;

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

    // Na aba de revisões o subassunto aparece como "Assunto › Subassunto".
    const concludedTopics = withoutContainers(sortedTopics)
        .filter(topic => topic.status === "CONCLUIDO")
        .map(topic => topic.parentTitle ? { ...topic, title: `${topic.parentTitle}${TOPIC_TITLE_SEPARATOR}${topic.title}` } : topic)
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
        { title: "1° Revisão", reviewIndex: 1, icon: <Clock size={20} />, topics: topicTimes.day },
        { title: "2° Revisão", reviewIndex: 2, icon: <Clock size={20} />, topics: topicTimes.week },
        { title: "3° Revisão", reviewIndex: 3, icon: <Clock size={20} />, topics: topicTimes.month },
        { title: "Concluído", icon: <CheckCircle2 size={20} className="text-primary" />, topics: topicTimes.concluded },
    ];

    return (
        <main className="introduction-Page flex flex-col">
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <span
                            className="size-4 shrink-0 rounded-full"
                            style={{ backgroundColor: subject.color || "#ccc" }}
                            aria-hidden="true"
                        />
                        <span className="min-w-0 truncate">{subject.title}</span>
                    </span>
                }
                description="Assuntos, notas e revisões desta matéria."
                actions={
                    <Link href="/materias" className={buttonVariants({ variant: "outline", size: "sm" })}>
                        <CornerDownLeft /> Matérias
                    </Link>
                }
            />
            <section className="flex flex-col gap-6">
                <Card size="sm">
                    <CardContent>
                        <ProgressLabelDemo label="Progresso de conclusão" value={Number(progressPercentage.toFixed(2))} description="dos assuntos concluídos" />
                    </CardContent>
                </Card>

                <nav aria-label="Seções da matéria" className="glass flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl p-1">
                    <Link href="?tab=assuntos" aria-current={tab === 'assuntos' ? "page" : undefined} className={tab === 'assuntos' ? activeTabStyle : inactiveTabStyle}>
                        Assuntos <Badge variant="secondary">{totalTopics}</Badge>
                    </Link>
                    <Link href="?tab=notas" aria-current={tab === 'notas' ? "page" : undefined} className={tab === 'notas' ? activeTabStyle : inactiveTabStyle}>
                        Notas <Badge variant="secondary">{subject.notes?.length ?? 0}</Badge>
                    </Link>
                    <Link href="?tab=revisoes" aria-current={tab === 'revisoes' ? "page" : undefined} className={tab === 'revisoes' ? activeTabStyle : inactiveTabStyle}>
                        Revisões <Badge variant="secondary">{allReviews.filter(r => !r.concluded && r.status).length}</Badge>
                    </Link>
                </nav>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {tab === 'assuntos' && (
                        <div className="glass col-span-1 rounded-2xl p-3 md:col-span-3">
                            <TopicList sortedTopics={sortedTopics} subject={subject} />
                            <CreateTopicForm subjectId={subject.id} />
                        </div>
                    )}

                    {tab === 'notas' && (
                        <div className="animate-in fade-in duration-300 space-y-4 col-span-1 md:col-span-3">
                            <div className="flex items-center justify-end mb-4">
                                <CreateNoteDialog subjectId={id} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {sortedNotes && sortedNotes.length > 0 ? (
                                    sortedNotes.map(note => {
                                        const cleanHTML = DOMPurify.sanitize(note.content);

                                        return (
                                            <Card key={note.id} className="flex flex-col justify-between">
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-3">
                                                    <CardTitle className="truncate" title={note.title}>
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
                                    <p className="glass col-span-1 rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground md:col-span-2">Nenhuma nota nesta matéria. Use Nova nota para criar a primeira.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'revisoes' && (
                        <div className="animate-in fade-in duration-300 w-full flex flex-col gap-3 col-span-1 md:col-span-3">
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
                        <Card className="w-full" size="sm">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between gap-2">Cronograma <CalendarClock className="size-4 text-muted-foreground" /></CardTitle>
                                <p className="text-xs text-muted-foreground">Dias da semana em que a matéria aparece no cronograma.</p>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-1.5">
                                {timelineDays && timelineDays.length > 0 ? (
                                    <>
                                        {timelineDays.map((day) => (
                                            <Badge key={day} variant="secondary">{day}</Badge>
                                        ))}
                                    </>

                                ) : (
                                    <p className="text-sm text-muted-foreground">Sem dias vinculados.</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="w-full" size="sm">
                            <CardHeader>
                                <CardTitle>Calendário</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <Calendar
                                    className="w-full max-w-65 rounded-xl p-1"
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

import { getTopicsAction } from "@/actions/topics.actions";
import { ReviewSection, ReviewSectionSkeleton } from "@/components/reviewSection";
import { PageHeader } from "@/components/page-header";
import { Topic } from "@/types/topic";
import { CheckCircle2, Clock } from "lucide-react";
import { Suspense } from "react";

async function RevisaoContent() {
    const topics = (await getTopicsAction()).filter(topic => topic.status === "CONCLUIDO");

    if (topics.length === 0) {
        return (
            <div className="glass flex flex-col items-center gap-1 rounded-2xl px-6 py-12 text-center">
                <p className="font-medium">Nenhuma revisão por aqui ainda</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                    Conclua um assunto em uma matéria e ele entra no ciclo de revisões. Se você já concluiu e nada aparece, recarregue a página.
                </p>
            </div>
        );
    }

    const now = new Date();

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

    const topicTimes = {
        concluded: topics.filter(
            topic =>
                topic.reviews.first.concluded ||
                topic.reviews.second.concluded ||
                topic.reviews.third.concluded
        ),
        day: sortReviews(
            topics.filter(topic => !topic.reviews.first.concluded),
            "first"
        ),
        week: sortReviews(
            topics.filter(topic => !topic.reviews.second.concluded),
            "second"
        ),
        month: sortReviews(
            topics.filter(topic => !topic.reviews.third.concluded),
            "third"
        ),
    };

    const sections = [
        { title: "1° Revisão", reviewIndex: 1, icon: <Clock size={20} />, topics: topicTimes.day },
        { title: "2° Revisão", reviewIndex: 2, icon: <Clock size={20} />, topics: topicTimes.week },
        { title: "3° Revisão", reviewIndex: 3, icon: <Clock size={20} />, topics: topicTimes.month },
        { title: "Concluído", icon: <CheckCircle2 size={20} className="text-primary" />, topics: topicTimes.concluded },
    ];

    return (
        <div className="flex flex-col gap-4">
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
    );
}

export default function RevisaoPage() {
    return (
        <div>
            <PageHeader
                title="Revisões"
                description="Acompanhe a 1ª, 2ª e 3ª revisão de cada assunto concluído. A próxima data se ajusta conforme você avalia: muito difícil, difícil, bom ou fácil."
            />
            <Suspense
                fallback={
                    <div className="flex flex-col gap-4">
                        <ReviewSectionSkeleton />
                    </div>
                }
            >
                <RevisaoContent />
            </Suspense>
        </div>
    );
}

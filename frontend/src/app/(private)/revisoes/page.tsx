import { getTopics } from "@/services/topics.service";
import { Topic } from "@/types/topic";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Suspense } from "react";
import { ReviewSection, ReviewSectionSkeleton } from "./components/reviewSection";

async function RevisaoContent() {
    let topics: Topic[] | null = null;

    try {
        const rawTopics = await getTopics();
        topics = rawTopics.filter(topic => topic.status === "CONCLUIDO");
    } catch (error) {
        console.error("Erro ao carregar revisões:", error);
    }

    if (!topics) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive gap-2">
                <AlertCircle size={32} />
                <p className="font-medium">Não foi possível carregar suas revisões.</p>
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
            topics.filter(topic => topic.reviews.first.concluded && !topic.reviews.second.concluded),
            "second"
        ),
        month: sortReviews(
            topics.filter(topic => topic.reviews.second.concluded && !topic.reviews.third.concluded),
            "third"
        ),
    };

    const sections = [
        { title: "24 horas", reviewIndex: 1, icon: <Clock size={20} />, topics: topicTimes.day },
        { title: "7 dias", reviewIndex: 2, icon: <Clock size={20} />, topics: topicTimes.week },
        { title: "30 dias", reviewIndex: 3, icon: <Clock size={20} />, topics: topicTimes.month },
        { title: "Concluído", icon: <CheckCircle2 size={20} className="text-green-500" />, topics: topicTimes.concluded },
    ];

    return (
        <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-1 min-h-screen pb-10">
            <header>
                <h1 className="px-2 text-xl font-bold shadow-sm bg-card py-4">
                    Revisões
                </h1>
                <p className="p-2 py-4 font-medium text-sm text-muted-foreground">
                    Visualize suas revisões. Elas são espaçadas entre 24 horas, 7 dias e 30 dias.
                </p>
            </header>

            <Suspense
                fallback={
                    <div className="flex flex-col gap-3">
                        <ReviewSectionSkeleton />
                    </div>
                }
            >
                <RevisaoContent />
            </Suspense>
        </div>
    );
}

import { getTopics } from "@/services/topics.service";
import { Topic } from "@/types/topic";
import { CheckCircle2, Clock } from "lucide-react";
import { ReviewSection } from "./components/reviewSection";

export default async function RevisaoPage() {
    const topics = (await getTopics()).filter(topic => topic.status === "CONCLUIDO")

    const now = new Date();

    const sortReviews = (
        topics: Topic[],
        reviewKey: "first" | "second" | "third"
    ) => {
        return [...topics].sort((a, b) => {
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
    }

    const sections = [
        {
            title: "24 horas",
            reviewIndex: 1,
            icon: <Clock size={20} />,
            topics: topicTimes.day,
        },
        {
            title: "7 dias",
            reviewIndex: 2,
            icon: <Clock size={20} />,
            topics: topicTimes.week,
        },
        {
            title: "30 dias",
            reviewIndex: 3,
            icon: <Clock size={20} />,
            topics: topicTimes.month,
        },
        {
            title: "Concluído",
            icon: <CheckCircle2 size={20} className="text-green-500" />,
            topics: topicTimes.concluded,
        },
    ];

    return (
        <div className="flex flex-col gap-1 min-h-screen pb-10">
            <header className="">
                <h1 className="px-2 text-xl font-bold shadow-sm bg-card py-4">
                    Revisões
                </h1>
                <p className="p-2 py-4 font-medium text-sm text-muted-foreground">
                    Visualize suas revisões. Elas são espaçadas entre 24 horas, 7 dias e 30 dias.
                </p>
            </header>

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
        </div>
    )
}
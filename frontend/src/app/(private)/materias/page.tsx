import { getSubjectsAction } from "@/actions/subjects.actions";
import { getTopicsAction } from "@/actions/topics.actions";
import { ScrambleText } from "@/components/scramble-text";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { Suspense } from "react";
import MateriasClient, { MateriasSkeleton } from "./components/materias-client";

async function MateriasContent() {
    let subjectsWithTopics: (Subject & { topics: Topic[] })[] = [];

    const [allSubjects, allTopics] = await Promise.all([
        getSubjectsAction(),
        getTopicsAction()
    ]);

    const topicsMap = new Map();
    allTopics.forEach((topic: Topic) => {
        const subjectId = topic.subject?.id;
        if (!topicsMap.has(subjectId)) {
            topicsMap.set(subjectId, []);
        }
        topicsMap.get(subjectId).push(topic);
    });

    subjectsWithTopics = allSubjects.map((subject: Subject) => ({
        ...subject,
        topics: topicsMap.get(subject.id) ?? []
    }));

    return <MateriasClient subjects={subjectsWithTopics} />;
}

export default function MateriasPage() {
    return (
        <>
            <h1 className="px-2 py-4 text-xl font-bold shadow-sm bg-card z-9"><ScrambleText text="MATÉRIAS" /></h1>
            <section className="introduction-Page">
                <Suspense fallback={<MateriasSkeleton />}>
                    <div className="reverse-introduction-page">
                        <MateriasContent />
                    </div>
                </Suspense>
            </section>
        </>
    );
}
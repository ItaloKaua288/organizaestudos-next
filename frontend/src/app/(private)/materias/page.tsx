import { getSubjects } from "@/services/subjects.service";
import { getTopics } from "@/services/topics.service";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { Suspense } from "react";
import MateriasClient, { MateriasSkeleton } from "./components/materias-client";

async function MateriasContent() {
    let subjectsWithTopics: (Subject & { topics: Topic[] })[] = [];

    try {
        const [allSubjects, allTopics] = await Promise.all([
            getSubjects(),
            getTopics()
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

    } catch (error) {
        console.error("Erro ao carregar dados no servidor:", error);
    }

    return <MateriasClient subjects={subjectsWithTopics} />;
}

export default function MateriasPage() {
    return (
        <Suspense fallback={<MateriasSkeleton />}>
            <MateriasContent />
        </Suspense>
    );
}
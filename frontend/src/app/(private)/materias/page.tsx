import { getSubjects } from "@/services/subjects.service";
import { getTopics } from "@/services/topics.service";
import MateriasClient from "./components/materias-client";
import { Topic } from "@/types/topic";
import { Subject } from "@/types/subject";

export default async function MateriasPage() {
    let subjectsWithTopics: (Subject & { topics: Topic[] })[];

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

        return (
            <div className="p-4 text-red-500">
                <h2>Erro ao carregar as matérias.</h2>
            </div>
        );
    }
    return <MateriasClient subjects={subjectsWithTopics} />;
}
import { getSubjectsAction } from "@/actions/subjects.actions";
import { getTopicsAction } from "@/actions/topics.actions";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { LAYOUT_COOKIE, parseLayout } from "./components/layout-cookie";
import MateriasClient, { MateriasSkeleton } from "./components/materias-client";

async function MateriasContent() {
    let subjectsWithTopics: (Subject & { topics: Topic[] })[] = [];

    const [allSubjects, allTopics] = await Promise.all([
        getSubjectsAction(),
        // Títulos reais (sem o prefixo "Assunto › ") porque esta tela permite editar os títulos.
        getTopicsAction({ rawTitles: true, includeContainers: true })
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

    // Último layout escolhido (salvo em cookie) para a página já abrir do jeito certo.
    const initialLayout = parseLayout((await cookies()).get(LAYOUT_COOKIE)?.value);

    return <MateriasClient subjects={subjectsWithTopics} initialLayout={initialLayout} />;
}

export default function MateriasPage() {
    return (
        <section className="introduction-Page">
            <Suspense fallback={<MateriasSkeleton />}>
                <MateriasContent />
            </Suspense>
        </section>
    );
}

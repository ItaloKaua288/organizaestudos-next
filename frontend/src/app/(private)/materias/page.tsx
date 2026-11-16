import { getSubjectsAction } from "@/actions/subjects.actions";
import { getTopicsAction } from "@/actions/topics.actions";
import { Subject } from "@/types/subject";
import { Topic } from "@/types/topic";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { LAYOUT_COOKIE, parseLayout } from "./components/layout-cookie";
import { VIEW_COOKIE, parseViewPrefs } from "./components/view-prefs";
import MateriasClient, { MateriasSkeleton } from "./components/materias-client";
import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Matérias",
};

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
    const cookieStore = await cookies();
    const initialLayout = parseLayout(cookieStore.get(LAYOUT_COOKIE)?.value);
    // Última ordenação/filtros escolhidos (também em cookie).
    const initialViewPrefs = parseViewPrefs(cookieStore.get(VIEW_COOKIE)?.value);

    return <MateriasClient subjects={subjectsWithTopics} initialLayout={initialLayout} initialViewPrefs={initialViewPrefs} />;
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

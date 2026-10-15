import { getQuestionStatsAction } from "@/actions/questions.actions";
import { PageHeader } from "@/components/page-header";
import { DesempenhoClient } from "./components/desempenho-client";

export default async function DesempenhoPage() {
    const stats = await getQuestionStatsAction();

    return (
        <main>
            <PageHeader
                title="Desempenho"
                description="Seu % de acerto por matéria e por assunto. Os pontos mais fracos aparecem primeiro."
            />

            <DesempenhoClient stats={stats} />
        </main>
    );
}

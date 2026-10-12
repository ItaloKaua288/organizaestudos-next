import { getQuestionStatsAction } from "@/actions/questions.actions";
import { ScrambleText } from "@/components/scramble-text";
import { DesempenhoClient } from "./components/desempenho-client";

export default async function DesempenhoPage() {
    const stats = await getQuestionStatsAction();

    return (
        <main className="space-y-4 pb-8">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    <ScrambleText text="DESEMPENHO" />
                </h1>
                <p className="px-2 text-sm font-medium text-muted-foreground">
                    Seu % de acerto por matéria e por assunto. Os pontos mais fracos aparecem primeiro.
                </p>
            </header>

            <DesempenhoClient stats={stats} />
        </main>
    );
}

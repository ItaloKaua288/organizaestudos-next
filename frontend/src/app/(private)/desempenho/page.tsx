import { getProfilesAction } from "@/actions/profiles.actions";
import { getQuestionStatsAction } from "@/actions/questions.actions";
import { PageHeader } from "@/components/page-header";
import { DesempenhoClient } from "./components/desempenho-client";
import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Desempenho",
};

export default async function DesempenhoPage() {
    const [stats, profilesState] = await Promise.all([
        getQuestionStatsAction(),
        // Sem a data da prova a projeção some, mas o resto da página segue funcionando.
        getProfilesAction().catch(() => null),
    ]);
    const activeProfile = profilesState?.profiles.find((profile) => profile.id === profilesState.activeProfileId) ?? null;

    return (
        <main>
            <PageHeader
                title="Desempenho"
                description="Seu % de acerto por matéria e por assunto. Os pontos mais fracos aparecem primeiro."
            />

            <DesempenhoClient stats={stats} examDate={activeProfile?.examDate ?? null} />
        </main>
    );
}

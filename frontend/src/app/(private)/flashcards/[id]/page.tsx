import { getDeckAction } from "@/actions/flashcards.actions";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { DeckClient } from "../components/deck-client";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getDeckAction(id);

    if (!data) {
        return (
            <main className="introduction-Page flex flex-col items-start gap-4">
                <PageHeader title="Baralho não encontrado" description="Ele pode ter sido removido ou pertencer a outro perfil de estudo." />
                <Link href="/flashcards" className={buttonVariants({ variant: "outline" })}>
                    <CornerDownLeft /> Voltar para os baralhos
                </Link>
            </main>
        );
    }

    return (
        <section className="introduction-Page">
            <DeckClient deck={data.deck} cards={data.cards} />
        </section>
    );
}

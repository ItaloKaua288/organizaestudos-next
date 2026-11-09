import { getDecksAction } from "@/actions/flashcards.actions";
import { Suspense } from "react";
import { DecksClient, DecksSkeleton } from "./components/decks-client";
import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Flashcards",
};

async function DecksContent() {
    const decks = await getDecksAction();
    return <DecksClient decks={decks} />;
}

export default function FlashcardsPage() {
    return (
        <section className="introduction-Page">
            <Suspense fallback={<DecksSkeleton />}>
                <DecksContent />
            </Suspense>
        </section>
    );
}

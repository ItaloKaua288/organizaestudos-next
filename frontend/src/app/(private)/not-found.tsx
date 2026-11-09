import { NotFoundCard } from "@/components/not-found-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Página não encontrada",
};

/** 404 dentro do app (quando uma página chama notFound()): mantém o menu e o visual. */
export default function NotFound() {
    return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center">
            <NotFoundCard />
        </main>
    );
}

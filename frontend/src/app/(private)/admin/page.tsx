import { getAdminUsersAction } from "@/actions/admin.actions";
import { ScrambleText } from "@/components/scramble-text";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminClient } from "./components/admin-client";

export const metadata: Metadata = {
    title: "Admin | Organiza Estudos",
};

export default async function AdminPage() {
    const state = await getAdminUsersAction();

    // Quem não é administrador volta para o início.
    if (state.status === "forbidden") redirect("/");

    return (
        <main className="space-y-6 pb-10">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    <ScrambleText text="ADMIN" />
                </h1>
                <p className="px-2 text-sm font-medium text-muted-foreground">
                    Veja quem usa o app e gerencie as contas.
                </p>
            </header>

            {state.status === "error" ? (
                <p className="px-2 text-sm text-muted-foreground">
                    Não foi possível carregar os usuários. Recarregue a página para tentar de novo.
                </p>
            ) : (
                <div className="mx-auto w-full max-w-6xl px-2">
                    <AdminClient initialUsers={state.users} currentUserId={state.currentUserId} />
                </div>
            )}
        </main>
    );
}

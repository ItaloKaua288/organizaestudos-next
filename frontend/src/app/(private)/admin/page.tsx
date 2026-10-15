import { getAdminUsersAction } from "@/actions/admin.actions";
import { PageHeader } from "@/components/page-header";
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
        <main>
            <PageHeader title="Admin" description="Veja quem usa o app e gerencie as contas." />

            {state.status === "error" ? (
                <p className="glass rounded-2xl p-5 text-sm text-muted-foreground">
                    Não foi possível carregar os usuários. Recarregue a página para tentar de novo.
                </p>
            ) : (
                <AdminClient initialUsers={state.users} currentUserId={state.currentUserId} />
            )}
        </main>
    );
}

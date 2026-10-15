import { getAccountAction } from "@/actions/user.actions";
import { PageHeader } from "@/components/page-header";
import { IdentityCard } from "./components/identity-card";
import { NameForm } from "./components/name-form";
import { PasswordForm } from "./components/password-form";
import { StudyLedger } from "./components/study-ledger";

export default async function PerfilPage() {
    const account = await getAccountAction();

    return (
        <main>
            <PageHeader
                title="Perfil"
                description="Seus dados da conta e um resumo de tudo que você já estudou."
            />

            {!account ? (
                <p className="glass rounded-2xl p-5 text-sm text-muted-foreground">
                    Não foi possível carregar os dados da sua conta. Recarregue a página para tentar de novo.
                </p>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
                        <IdentityCard account={account} />
                        <StudyLedger stats={account.stats} />
                    </div>

                    <section
                        aria-label="Configurações da conta"
                        className="glass grid overflow-hidden rounded-3xl max-md:divide-y max-md:divide-border md:grid-cols-2 md:divide-x md:divide-border"
                    >
                        <NameForm currentName={account.name} />
                        <PasswordForm />
                    </section>
                </div>
            )}
        </main>
    );
}

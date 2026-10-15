import { getAccountAction } from "@/actions/user.actions";
import { ScrambleText } from "@/components/scramble-text";
import { IdentityCard } from "./components/identity-card";
import { NameForm } from "./components/name-form";
import { PasswordForm } from "./components/password-form";
import { StudyLedger } from "./components/study-ledger";

export default async function PerfilPage() {
    const account = await getAccountAction();

    return (
        <main className="space-y-6 pb-10">
            <header className="space-y-1">
                <h1 className="bg-card py-4 px-2 text-xl font-bold shadow-sm">
                    <ScrambleText text="PERFIL" />
                </h1>
                <p className="px-2 text-sm font-medium text-muted-foreground">
                    Seus dados da conta e um resumo de tudo que você já estudou.
                </p>
            </header>

            {!account ? (
                <p className="px-2 text-sm text-muted-foreground">
                    Não foi possível carregar os dados da sua conta. Recarregue a página para tentar de novo.
                </p>
            ) : (
                <div className="mx-auto w-full max-w-5xl space-y-8 px-2">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
                        <IdentityCard account={account} />
                        <StudyLedger stats={account.stats} />
                    </div>

                    <section
                        aria-label="Configurações da conta"
                        className="grid overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 max-md:divide-y md:grid-cols-2 md:divide-x"
                    >
                        <NameForm currentName={account.name} />
                        <PasswordForm />
                    </section>
                </div>
            )}
        </main>
    );
}

import { buttonVariants } from "@/components/ui/button";
import { Compass } from "lucide-react";
import Link from "next/link";

/**
 * Conteúdo da página 404, usado dentro do app (com menu) e na versão global (sem layout).
 * Na versão global o roteador do Next não está montado, então o `Link` não navega: `plainLinks`
 * troca por links comuns, que carregam a página do zero.
 */
export function NotFoundCard({ plainLinks = false }: { plainLinks?: boolean }) {
    const AppLink = plainLinks ? "a" : Link;

    return (
        <div className="glass flex w-full max-w-md flex-col items-center gap-3 rounded-3xl p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Compass size={24} aria-hidden="true" />
            </span>
            <p className="font-heading text-5xl font-semibold tracking-tight text-muted-foreground tabular-nums" aria-hidden="true">
                404
            </p>
            <h1 className="text-xl font-semibold">Página não encontrada</h1>
            <p className="text-sm text-balance text-muted-foreground">
                O endereço pode estar errado ou a página foi removida. Volte ao início ou abra suas matérias.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
                <AppLink href="/" className={buttonVariants()}>
                    Ir para o Dashboard
                </AppLink>
                <AppLink href="/materias" className={buttonVariants({ variant: "outline" })}>
                    Ver matérias
                </AppLink>
            </div>
        </div>
    );
}

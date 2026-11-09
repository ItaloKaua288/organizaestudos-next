import { Logo } from "@/components/logo";
import { NotFoundCard } from "@/components/not-found-card";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Página não encontrada | Organiza Estudos",
};

/**
 * 404 para endereços que não existem em nenhuma rota. O app tem dois layouts raiz ((private) e (public)),
 * então não há layout único para montar este erro: esta página traz o próprio <html> e o visual do app.
 */
export default function GlobalNotFound() {
    return (
        <html lang="pt-BR" className={cn("h-full", "antialiased", "font-sans", fontVariables)} suppressHydrationWarning>
            <body className="mx-auto flex min-h-full max-w-[1920px] flex-col">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <div aria-hidden className="ambient" />
                    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
                        <Logo />
                        <NotFoundCard plainLinks />
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}

import { Navbar2 } from "@/components/Navbar2";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { PROFILE_COOKIE } from "@/lib/profile-cookie";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Toaster } from 'react-hot-toast';
import "../globals.css";

export const metadata: Metadata = {
  title: "Organiza Estudos"
};

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Quando o perfil muda, o conteúdo é recriado do zero. Sem isso, telas que copiam os dados
  // do servidor para um useState (ex.: ciclo de estudos) continuariam mostrando o perfil anterior.
  const profileKey = (await cookies()).get(PROFILE_COOKIE)?.value ?? "default";

  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", "font-sans", fontVariables)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col mx-auto max-w-[1920px]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "glass-popover",
              style: {
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                borderRadius: "1rem",
                backdropFilter: "blur(20px)",
              },
            }}
          />
          <div aria-hidden className="ambient" />
          <Navbar2 />
          <div key={profileKey} className="mx-auto w-full max-w-7xl flex-1 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

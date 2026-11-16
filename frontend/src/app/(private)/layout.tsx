import { getTopicsAction } from "@/actions/topics.actions";
import { Navbar2 } from "@/components/Navbar2";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { countDueReviews } from "@/lib/review-due";
import { ContentShell } from "@/components/content-shell";
import { NavPrefsProvider } from "@/components/nav-prefs-provider";
import { readPrefs } from "@/lib/layout-preference";
import { PROFILE_COOKIE } from "@/lib/profile-cookie";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Toaster } from 'react-hot-toast';
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Organiza Estudos",
    template: "%s | Organiza Estudos",
  },
};

export const dynamic = 'force-dynamic'

/** Selo do menu: revisões de hoje + atrasadas. Se a API falhar, o menu só fica sem o selo. */
async function getPendingReviewsCount() {
  try {
    return countDueReviews(await getTopicsAction());
  } catch {
    return 0;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Quando o perfil muda, o conteúdo é recriado do zero. Sem isso, telas que copiam os dados
  // do servidor para um useState (ex.: ciclo de estudos) continuariam mostrando o perfil anterior.
  const cookieStore = await cookies();
  const profileKey = cookieStore.get(PROFILE_COOKIE)?.value ?? "default";
  const prefs = readPrefs((name) => cookieStore.get(name)?.value);
  const hasToken = Boolean(cookieStore.get("token")?.value);
  const pendingReviews = hasToken ? await getPendingReviewsCount() : 0;

  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", "font-sans", fontVariables)}
      data-density={prefs.density}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col mx-auto max-w-[1920px]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster
            position="bottom-right"
            containerClassName="max-xl:mb-20"
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
          <NavPrefsProvider initial={prefs}>
            <Navbar2 hasToken={hasToken} pendingReviews={pendingReviews} />
            <ContentShell profileKey={profileKey}>{children}</ContentShell>
          </NavPrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { Navbar2 } from "@/components/Navbar2";
import { ThemeProvider } from "@/components/theme-provider";
import { PROFILE_COOKIE } from "@/lib/profile-cookie";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from 'react-hot-toast';
import "../globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col mx-auto max-w-[1920px]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster position="bottom-right" />
          <Navbar2 />
          <div className="fixed -z-10 inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px]" />
          <div className="min-h-18"></div>
          <div key={profileKey} className="contents">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
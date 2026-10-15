import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Organiza Estudos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", "font-sans", fontVariables)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col max-w-[1920px] mx-auto">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div aria-hidden className="ambient" />
          <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono, Sora } from "next/font/google";

// Corpo do texto: Geist. Títulos e números grandes: Sora.
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${sora.variable}`;

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IRONPARSE // Powerbuilding & Hypertrophy Overload Tracker",
  description:
    "Dashboard inteligente de Powerbuilding: digite seu treino em texto puro e acompanhe sua sobrecarga progressiva com IA (Gemini Flash).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} w-full`}>
      <body className="antialiased w-full min-h-screen">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";
import ScrollObserver from "../../components/layout/ScrollObserver";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teko - Saúde Mental Infantil com Tecnologia e Afeto",
  description: "Teko transforma avaliações clínicas infantis em jogos lúdicos, gerando dados estruturados de forma invisível.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body-md overflow-x-hidden selection:bg-teko-yellow/30 selection:text-white relative min-h-screen flex flex-col">
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-radial-gradient rounded-full mix-blend-screen blur-[80px] animate-pulse-slow"></div>
            <div className="absolute bottom-[10%] right-[-10%] w-[50vw] h-[50vw] bg-radial-gradient rounded-full mix-blend-screen blur-[100px]" style={{animation: 'pulse 6s infinite alternate'}}></div>
        </div>
        
        <SiteHeader lang={lang} />
        <ScrollObserver />
        
        <main className="flex-grow">
          {children}
        </main>

        <SiteFooter lang={lang} />
      </body>
    </html>
  );
}

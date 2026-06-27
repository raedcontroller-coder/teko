"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function SiteHeader({ lang = "pt" }: { lang?: string }) {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = path === `/${lang}` ? pathname === path : pathname?.startsWith(path);
    return `transition-colors font-label-md text-label-md ${
      isActive ? "text-teko-yellow font-bold" : "text-white/80 hover:text-white"
    }`;
  };

  return (
    <nav className="bg-deep-forest/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/10 transition-all duration-300">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
        <div className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform duration-200">
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <Image
              alt="Teko Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-cover rounded-xl shadow-lg border border-white/20"
              src="/images/teko_icone.jpeg"
            />
            <span className="font-display-lg-mobile md:font-headline-lg font-black text-white tracking-tight">Teko</span>
          </Link>
        </div>
        <div className="hidden md:flex gap-8">
          <Link href={`/${lang}`} className={getLinkClass(`/${lang}`)}>
            Início
          </Link>
          <Link href={`/${lang}/validacao-clinica`} className={getLinkClass(`/${lang}/validacao-clinica`)}>
            Validação
          </Link>
          <Link href={`/${lang}/equipe`} className={getLinkClass(`/${lang}/equipe`)}>
            Equipe
          </Link>
          <Link href={`/${lang}/planos`} className={getLinkClass(`/${lang}/planos`)}>
            Planos
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          <Link href={`/${lang}/login`}>
            <button className="hidden md:block font-cta-lg text-cta-lg text-white/80 hover:text-white transition-colors">
              Entrar
            </button>
          </Link>
          <button className="bg-teko-yellow text-on-secondary-fixed font-cta-lg text-cta-lg px-6 py-2.5 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_4px_14px_rgba(230,168,0,0.39)] hover:shadow-[0_6px_20px_rgba(230,168,0,0.5)]">
            Começar Agora
          </button>
        </div>
      </div>
    </nav>
  );
}

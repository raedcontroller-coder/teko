"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const translations: Record<string, { home: string; validation: string; team: string; plans: string; login: string; start: string }> = {
  pt: {
    home: "Início",
    validation: "Validação",
    team: "Equipe",
    plans: "Planos",
    login: "Entrar",
    start: "Começar Agora"
  },
  en: {
    home: "Home",
    validation: "Validation",
    team: "Team",
    plans: "Plans",
    login: "Sign In",
    start: "Get Started"
  }
};

export default function SiteHeader({ lang = "pt" }: { lang?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLang = lang === "en" ? "en" : "pt";
  const t = translations[currentLang];

  const getLinkClass = (path: string) => {
    const isActive = path === `/${currentLang}` ? pathname === path : pathname?.startsWith(path);
    return `transition-colors font-label-md text-label-md ${
      isActive ? "text-teko-yellow font-bold" : "text-white/80 hover:text-white"
    }`;
  };

  const switchLanguage = (newLang: string) => {
    if (newLang === currentLang) return;
    if (!pathname) {
      router.push(`/${newLang}`);
      return;
    }
    const newPath = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPath.startsWith(`/${newLang}`) ? newPath : `/${newLang}`);
  };

  if (pathname?.includes('/cadastro') || pathname?.includes('/login') || pathname?.includes('/dashboard')) {
    return null;
  }

  return (
    <nav className="bg-deep-forest/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/10 transition-all duration-300">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 max-w-container-max mx-auto">
        <div className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform duration-200">
          <Link href={`/${currentLang}`} className="flex items-center gap-3">
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
          <Link href={`/${currentLang}`} className={getLinkClass(`/${currentLang}`)}>
            {t.home}
          </Link>
          <Link href={`/${currentLang}/validacao-clinica`} className={getLinkClass(`/${currentLang}/validacao-clinica`)}>
            {t.validation}
          </Link>
          <Link href={`/${currentLang}/equipe`} className={getLinkClass(`/${currentLang}/equipe`)}>
            {t.team}
          </Link>
          <Link href={`/${currentLang}/planos`} className={getLinkClass(`/${currentLang}/planos`)}>
            {t.plans}
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {/* Language Switcher Pill */}
          <div className="flex items-center bg-black/30 border border-white/15 rounded-full p-1 text-xs font-bold text-white/70">
            <button
              onClick={() => switchLanguage("pt")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                currentLang === "pt"
                  ? "bg-teko-yellow text-on-secondary-fixed font-black shadow-sm"
                  : "hover:text-white"
              }`}
            >
              PT
            </button>
            <button
              onClick={() => switchLanguage("en")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                currentLang === "en"
                  ? "bg-teko-yellow text-on-secondary-fixed font-black shadow-sm"
                  : "hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <Link href={`/${currentLang}/login`}>
            <button className="hidden md:block font-cta-lg text-cta-lg text-white/80 hover:text-white transition-colors">
              {t.login}
            </button>
          </Link>
          <Link href={`/${currentLang}/cadastro`}>
            <button className="bg-teko-yellow text-on-secondary-fixed font-cta-lg text-cta-lg px-6 py-2.5 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_4px_14px_rgba(230,168,0,0.39)] hover:shadow-[0_6px_20px_rgba(230,168,0,0.5)]">
              {t.start}
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}


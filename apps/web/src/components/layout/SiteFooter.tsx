"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const footerTranslations: Record<string, {
  desc: string;
  colPlatform: string;
  forClinics: string;
  plansPrices: string;
  scientificVal: string;
  colSocial: string;
  colLegal: string;
  termsUse: string;
  privacyPolicy: string;
  lgpdCompliance: string;
  rights: string;
}> = {
  pt: {
    desc: "Transformando a psicometria infantil com tecnologia e afeto. O uso da plataforma serve como suporte à decisão clínica, não substituindo a avaliação neuropsicológica presencial.",
    colPlatform: "Plataforma",
    forClinics: "Para Clínicas",
    plansPrices: "Planos e Preços",
    scientificVal: "Validação Científica",
    colSocial: "Redes Sociais",
    colLegal: "Legal",
    termsUse: "Termos de Uso",
    privacyPolicy: "Política de Privacidade",
    lgpdCompliance: "Conformidade LGPD",
    rights: "© 2026 Teko. Todos os direitos reservados."
  },
  en: {
    desc: "Transforming child psychometrics through technology and care. Platform usage serves as clinical decision support and does not replace in-person neuropsychological evaluation.",
    colPlatform: "Platform",
    forClinics: "For Clinics",
    plansPrices: "Plans & Pricing",
    scientificVal: "Scientific Validation",
    colSocial: "Social Media",
    colLegal: "Legal",
    termsUse: "Terms of Use",
    privacyPolicy: "Privacy Policy",
    lgpdCompliance: "Compliance & Privacy",
    rights: "© 2026 Teko. All rights reserved."
  }
};

export default function SiteFooter({ lang = "pt" }: { lang?: string }) {
  const pathname = usePathname();
  const currentLang = lang === "en" ? "en" : "pt";
  const t = footerTranslations[currentLang];
  
  if (pathname?.includes('/cadastro') || pathname?.includes('/login') || pathname?.includes('/dashboard')) {
    return null;
  }

  return (
    <footer className="bg-surface-container-lowest/80 backdrop-blur-xl w-full py-section-gap border-t border-white/10 mt-12 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Image
              alt="Teko Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-cover rounded-lg border border-white/20 grayscale opacity-50 shadow-md"
              src="/images/teko_icone.jpeg"
            />
            <span className="font-headline-md text-white/50">Teko</span>
          </div>
          <p className="font-body-md text-white/50 text-sm mt-4 max-w-xs">
            {t.desc}
          </p>
        </div>
        
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <h4 className="font-headline-md text-white text-lg mb-2">{t.colPlatform}</h4>
            <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-block" href="#">{t.forClinics}</Link>
            <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-block" href={`/${currentLang}/planos`}>{t.plansPrices}</Link>
            <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-block" href={`/${currentLang}/validacao-clinica`}>{t.scientificVal}</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-headline-md text-white text-lg mb-2">{t.colSocial}</h4>
            <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-flex items-center gap-2" href="#">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              Instagram
            </Link>
            <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-flex items-center gap-2" href="#">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              LinkedIn
            </Link>
            <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-flex items-center gap-2" href="#">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              WhatsApp
            </Link>
          </div>
        </div>
        
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="font-headline-md text-white text-lg mb-2">{t.colLegal}</h4>
          <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-block" href="#">{t.termsUse}</Link>
          <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-block" href="#">{t.privacyPolicy}</Link>
          <Link className="font-label-md text-white/60 hover:text-white transition-colors inline-block" href="#">{t.lgpdCompliance}</Link>
        </div>
      </div>
      
      <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-body-md text-xs text-white/40">{t.rights}</p>
      </div>
    </footer>
  );
}


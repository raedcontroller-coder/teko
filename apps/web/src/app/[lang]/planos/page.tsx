import { getDictionary } from "../../../dictionaries";

export default async function PlanosPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "pt") as "en" | "pt";
  const dict = await getDictionary(lang);

  return (
    <div className="flex-grow flex flex-col items-center w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap pt-[120px]">
      {/* Hero Section */}
      <section className="text-center w-full mb-16 fade-in-up">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-display-lg-mobile md:font-display-lg text-white leading-[1.1] font-black mb-4">
          {dict.plans_section.title_line1} <span className="text-teko-yellow">{dict.plans_section.title_highlight1}</span> <span className="text-[#7B61FF]">{dict.plans_section.title_highlight2}</span>
        </h1>
        <p className="font-body-lg text-text-muted max-w-2xl mx-auto">
          {dict.plans_section.subtitle}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center w-full mb-section-gap">
          <div className="glass-panel rounded-[2rem] p-8 fade-in-up transition-all hover:-translate-y-2 duration-300">
            <h3 className="font-headline-md text-2xl text-white mb-2">{dict.plans_section.essential_title}</h3>
            <p className="font-body-md text-white/70 mb-6 min-h-[48px]">{dict.plans_section.essential_desc}</p>
            <div className="mb-8">
              <span className="font-display-lg-mobile text-white font-black">{dict.plans_section.essential_price}</span><span className="text-white/50 text-sm">{dict.plans_section.essential_period}</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.essential_feat1}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.essential_feat2}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.essential_feat3}</span></li>
              <li className="flex items-start gap-3 opacity-30"><span className="material-symbols-outlined text-white/50 text-sm mt-1">cancel</span> <span className="font-body-md text-white/90 line-through">{dict.plans_section.essential_feat4}</span></li>
            </ul>
            <button className="block w-full text-center bg-transparent border-2 border-white/20 text-white font-cta-lg py-3 rounded-full hover:bg-white/10 transition-colors">{dict.plans_section.essential_cta}</button>
          </div>

          <div className="glass-panel border-teko-yellow/50 rounded-[2.5rem] p-10 relative shadow-[0_0_40px_rgba(230,168,0,0.15)] md:-translate-y-4 z-10 scale-105 bg-gradient-to-b from-[rgba(230,168,0,0.05)] to-transparent opacity-100 transition-all duration-500 hover:scale-[1.07]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teko-yellow text-on-secondary-fixed font-bold text-sm px-6 py-1.5 rounded-full shadow-lg">{dict.plans_section.badge_recommended}</div>
            <h3 className="font-headline-md text-3xl text-white mb-2 mt-2">{dict.plans_section.prof_title}</h3>
            <p className="font-body-md text-white/80 mb-6 min-h-[48px]">{dict.plans_section.prof_desc}</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="font-display-lg text-teko-yellow font-black leading-none">{dict.plans_section.prof_price}</span><span className="text-white/50 text-sm">{dict.plans_section.prof_period}</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-teko-yellow text-lg">verified</span> <span className="font-body-md text-white font-medium">{dict.plans_section.prof_feat1}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-teko-yellow text-lg">insights</span> <span className="font-body-md text-white">{dict.plans_section.prof_feat2}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-teko-yellow text-lg">library_books</span> <span className="font-body-md text-white">{dict.plans_section.prof_feat3}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-tertiary-fixed-dim text-lg">psychology</span> <span className="font-body-md text-white">{dict.plans_section.prof_feat4}</span></li>
            </ul>
            <button className="block w-full text-center bg-teko-yellow text-on-secondary-fixed font-cta-lg py-4 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(230,168,0,0.4)] text-lg">{dict.plans_section.prof_cta}</button>
          </div>

          <div className="glass-panel rounded-[2rem] p-8 fade-in-up transition-all hover:-translate-y-2 duration-300">
            <h3 className="font-headline-md text-2xl text-white mb-2">{dict.plans_section.clinic_title}</h3>
            <p className="font-body-md text-white/70 mb-6 min-h-[48px]">{dict.plans_section.clinic_desc}</p>
            <div className="mb-8">
              <span className="font-display-lg-mobile text-white font-black">{dict.plans_section.clinic_price}</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-tertiary-fixed-dim text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.clinic_feat1}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-tertiary-fixed-dim text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.clinic_feat2}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-tertiary-fixed-dim text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.clinic_feat3}</span></li>
              <li className="flex items-start gap-3"><span className="material-symbols-outlined text-tertiary-fixed-dim text-sm mt-1">check_circle</span> <span className="font-body-md text-white/90">{dict.plans_section.clinic_feat4}</span></li>
            </ul>
            <button className="w-full bg-surface-container-lowest border border-white/10 text-white font-cta-lg py-3 rounded-full hover:bg-black/50 transition-colors">{dict.plans_section.clinic_cta}</button>
          </div>
      </section>

      <div className="divider-glass mb-section-gap fade-in-up"></div>
    </div>
  );
}

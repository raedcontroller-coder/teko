import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "../../dictionaries";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "pt") as "en" | "pt";
  const dict = await getDictionary(lang);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-40 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative min-h-[90vh] flex items-center">
        <div className="flex flex-col md:flex-row items-center gap-16 w-full relative z-10">
          <div className="flex-1 space-y-8 fade-in-up">
            <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-teko-yellow animate-pulse"></span>
              <span className="font-label-md text-sm text-white/90">{dict.hero.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-display-lg-mobile md:font-display-lg text-white leading-[1.1] font-black">
              {dict.hero.title_line1} <br />
              <span className="text-teko-yellow">{dict.hero.title_highlight1}</span> {dict.hero.title_line2} <br />
              <span className="text-[#7B61FF]">{dict.hero.title_highlight2}</span>
            </h1>

            <p className="font-body-lg text-body-lg text-text-muted max-w-xl leading-relaxed">
              {dict.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <Link href={`/${lang}/cadastro`} className="bg-teko-yellow text-on-secondary-fixed font-cta-lg text-cta-lg px-8 py-4 rounded-full hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,168,0,0.4)] animate-glow">
                {dict.hero.cta_primary}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link href={`/${lang}/login`} className="glass-panel text-white font-cta-lg text-cta-lg px-8 py-4 rounded-full hover:bg-white/10 transition-colors duration-300 flex items-center justify-center gap-2">
                {dict.hero.cta_secondary}
                <span className="material-symbols-outlined text-lg">login</span>
              </Link>
            </div>
          </div>

          <div className="flex-1 relative w-full aspect-square max-w-lg mx-auto animate-float fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-10 -left-10 w-24 h-24 glass-panel rounded-2xl animate-float-delayed flex items-center justify-center z-20 shadow-2xl border border-white/20">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[80px] md:text-[100px]">extension</span>
            </div>
            <div className="absolute bottom-10 -right-10 w-20 h-20 glass-panel rounded-full animate-float flex items-center justify-center z-20 shadow-2xl border border-white/20" style={{ animationDelay: '1s' }}>
              <span className="material-symbols-outlined text-teko-yellow text-[72px] md:text-[90px]">psychiatry</span>
            </div>

            <div className="relative w-full h-full glass-panel rounded-[2.5rem] p-6 flex items-center justify-center overflow-hidden border-2 border-white/20 z-10">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-tertiary-fixed-dim/20"></div>
              <Image
                src="/images/home-hero.webp"
                alt="A high-quality 3D render of a stylized smartphone displaying a playful, colorful game interface"
                width={500}
                height={500}
                className="relative z-10 w-4/5 object-cover rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Z-Pattern Section 1: O Que é a Teko? */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="sobre">
        <div className="flex flex-col md:flex-row items-center gap-16 z-pattern-row fade-in-up">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
              <span className="font-label-md text-sm text-white">{dict.about.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              {dict.about.title_line1} <span className="text-teko-yellow">{dict.about.title_highlight1}</span> {dict.about.title_line2} <span className="text-[#7B61FF]">{dict.about.title_highlight2}</span>
            </h2>

            <p className="font-body-lg text-text-muted leading-relaxed">
              {dict.about.description}
            </p>

            <ul className="space-y-4 pt-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center border border-primary/50 shrink-0">
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                </div>
                <p className="font-body-md text-white/90"><strong className="text-white">{dict.about.psychologist_label}</strong> {dict.about.psychologist_desc}</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-tertiary-fixed-dim/30 flex items-center justify-center border border-tertiary-fixed-dim/50 shrink-0">
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                </div>
                <p className="font-body-md text-white/90"><strong className="text-white">{dict.about.child_label}</strong> {dict.about.child_desc}</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-6 h-6 rounded-full bg-teko-yellow/30 flex items-center justify-center border border-teko-yellow/50 shrink-0">
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                </div>
                <p className="font-body-md text-white/90"><strong className="text-white">{dict.about.parent_label}</strong> {dict.about.parent_desc}</p>
              </li>
            </ul>
          </div>

          <div className="flex-1 w-full">
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group hover:border-white/30 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[60px]"></div>
              <Image
                src="/images/home-hero.webp"
                alt="Abstract visualization of a connected ecosystem"
                width={600}
                height={400}
                className="relative z-10 w-full aspect-video opacity-90 group-hover:opacity-100 transition-opacity object-cover rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Z-Pattern Section 2: Validação Científica */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative" id="ciencia">
        <div className="flex flex-col md:flex-row-reverse items-center gap-16 z-pattern-row fade-in-up">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
              <span className="font-label-md text-sm text-white">{dict.science.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              {dict.science.title_line1} <span className="text-teko-yellow">{dict.science.title_highlight1}</span> <br/>
              {dict.science.title_line2} <span className="text-[#7B61FF]">{dict.science.title_highlight2}</span>
            </h2>

            <p className="font-body-lg text-text-muted leading-relaxed">
              {dict.science.desc1}
            </p>

            <p className="font-body-md text-white/80 pb-4">
              {dict.science.desc2}
            </p>
          </div>

          <div className="flex-1 w-full">
            <div className="glass-panel rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col gap-6">
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-tertiary-fixed-dim/20 rounded-full blur-[80px]"></div>

              <div className="relative z-10 space-y-4 flex flex-col">
                <div className="inline-flex items-center gap-2 glass-pill px-3 py-1.5 rounded-full w-fit mb-2 border border-white/10">
                  <span className="material-symbols-outlined text-white/70 text-sm">info</span>
                  <span className="font-label-md text-xs text-white/80">{dict.science.illustrative_image}</span>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-headline-sm font-bold text-white text-lg">{dict.science.chart_title}</h3>
                  <span className="glass-pill px-3 py-1 rounded-full text-sm text-teko-yellow font-black border border-teko-yellow/20">{dict.science.chart_badge}</span>
                </div>

                <div className="h-40 grid grid-cols-4 gap-3 pb-2 border-b border-white/10 items-end">
                  <div className="w-full bg-primary/40 rounded-t-md h-[40%] relative"></div>
                  <div className="w-full bg-primary/70 rounded-t-md h-[70%] relative"></div>
                  <div className="w-full bg-teko-yellow/80 rounded-t-md h-[90%] relative"></div>
                  <div className="w-full bg-tertiary-fixed-dim/60 rounded-t-md h-[50%] relative"></div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-[9px] sm:text-[11px] text-white/60 font-label-md text-center tracking-tight">
                  <span className="truncate">{dict.science.attention}</span>
                  <span className="truncate">{dict.science.impulsivity}</span>
                  <span className="truncate">{dict.science.stress}</span>
                  <span className="truncate">{dict.science.anxiety}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Z-Pattern Section 3: App Download */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto" id="download">
        <div className="flex flex-col md:flex-row items-center gap-16 z-pattern-row fade-in-up">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              {dict.mobile.title_line1} <span className="text-teko-yellow">{dict.mobile.title_highlight1}</span> <br />
              {dict.mobile.title_line2} <span className="text-[#7B61FF]">{dict.mobile.title_highlight2}</span>
            </h2>

            <p className="font-body-lg text-text-muted leading-relaxed">
              {dict.mobile.description}
            </p>

            <div className="flex flex-wrap gap-3 py-4">
              <span className="glass-pill text-white px-4 py-2 rounded-full font-label-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-teko-yellow text-sm">sports_soccer</span> {dict.mobile.game_goalkeeper}
              </span>
              <span className="glass-pill text-white px-4 py-2 rounded-full font-label-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">photo_camera</span> {dict.mobile.game_photographer}
              </span>
              <span className="glass-pill text-white px-4 py-2 rounded-full font-label-md text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">sports_esports</span> {dict.mobile.game_toca_rapido}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button className="flex items-center gap-3 bg-black/50 border border-white/20 px-6 py-3 rounded-xl hover:bg-black/80 transition-colors backdrop-blur-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-1.05.65-2.22 1.62-2.22 3.19.01 1.92 1.63 2.72 2.37 3.49zm-5.1-15.35c.71-.85 1.18-2.03 1.05-3.21-1.01.04-2.26.68-2.99 1.54-.65.76-1.2 1.96-1.05 3.12 1.12.09 2.28-.61 2.99-1.45z"></path></svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/70 uppercase font-semibold">{dict.mobile.download_apple}</div>
                  <div className="font-headline-md text-lg text-white leading-none">App Store</div>
                </div>
              </button>

              <button className="flex items-center gap-3 bg-black/50 border border-white/20 px-6 py-3 rounded-xl hover:bg-black/80 transition-colors backdrop-blur-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186c-.165-.115-.296-.28-.37-.474-.074-.194-.103-.401-.082-.605V2.893c-.021-.204.008-.411.082-.605.074-.194.205-.359.37-.474zM14.945 13.153l3.665 3.665c-.244.17-.506.315-.783.432L5.808 24l9.137-10.847zM20.73 11.238l-4.633-4.633 4.633 4.633c.48.243.791.737.791 1.277 0 .54-.311 1.034-.791 1.277L20.73 11.238zM14.945 10.847L5.808 0l12.019 6.75c.277.117.539.262.783.432l-3.665 3.665z"></path></svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/70 uppercase font-semibold">{dict.mobile.download_google}</div>
                  <div className="font-headline-md text-lg text-white leading-none">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center relative">
            <div className="relative w-[280px] h-[580px] bg-surface-container-lowest rounded-[3rem] border-8 border-surface-variant shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-float">
              <div className="absolute top-0 w-full h-7 bg-surface-variant z-20 rounded-b-2xl flex justify-center items-end pb-1.5">
                <div className="w-16 h-1.5 bg-black/40 rounded-full"></div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-b from-primary to-background flex flex-col pt-12 px-6">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">person</span>
                  </div>
                </div>

                <div className="w-full aspect-square bg-glass-surface rounded-[2rem] border border-white/20 mb-6 flex items-center justify-center p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial-gradient-tertiary opacity-50"></div>
                  <Image
                    src="/images/teko_icone.jpeg"
                    alt="Teko App Game"
                    width={200}
                    height={200}
                    className="h-3/4 w-3/4 relative z-10 object-cover rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="w-full bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-teko-yellow rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-on-secondary-fixed">play_arrow</span></div>
                    <div>
                      <div className="font-headline-md text-white text-sm">{dict.mobile.continue_mission}</div>
                      <div className="text-xs text-white/60">{dict.mobile.game_photographer}</div>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 flex items-center justify-between">
                    <div className="text-sm text-white font-medium">{dict.mobile.progress}</div>
                    <div className="w-1/2 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-tertiary-fixed-dim w-3/4"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos (Bento Cards) - Teaser */}
      <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative" id="planos">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-display-lg-mobile md:font-display-lg text-white leading-[1.1] font-black mb-4">
            {dict.plans_section.title_line1} <br />
            <span className="text-teko-yellow">{dict.plans_section.title_highlight1}</span> <br />
            <span className="text-[#7B61FF]">{dict.plans_section.title_highlight2}</span>
          </h2>
          <p className="font-body-lg text-text-muted max-w-2xl mx-auto">{dict.plans_section.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
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
            <Link href={`/${lang}/planos`} className="block w-full text-center bg-transparent border-2 border-white/20 text-white font-cta-lg py-3 rounded-full hover:bg-white/10 transition-colors">{dict.plans_section.essential_cta}</Link>
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
            <Link href={`/${lang}/planos`} className="block w-full text-center bg-teko-yellow text-on-secondary-fixed font-cta-lg py-4 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(230,168,0,0.4)] text-lg">{dict.plans_section.prof_cta}</Link>
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
        </div>
      </section>
    </>
  );
}

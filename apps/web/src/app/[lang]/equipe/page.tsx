import Image from "next/image";
import { getDictionary } from "../../../dictionaries";

export default async function EquipePage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "pt") as "en" | "pt";
  const dict = await getDictionary(lang);

  return (
    <div className="pt-[120px] pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <section className="flex flex-col items-center text-center max-w-4xl mx-auto mb-section-gap gap-stack-md fade-in-up">
        <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-4">
          <span className="material-symbols-outlined text-teko-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          <span className="font-label-md text-sm text-white uppercase tracking-wider">{dict.equipe.badge}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-display-lg-mobile md:font-display-lg text-white leading-[1.1] font-black">
          {dict.equipe.title_line1} <span className="text-teko-yellow">{dict.equipe.title_highlight1}</span> <br />
          {dict.equipe.title_line2} <br />
          <span className="text-[#7B61FF]">{dict.equipe.title_highlight2}</span>
        </h1>
        <p className="font-body-lg text-white/80 max-w-2xl mx-auto mt-4 text-lg md:text-xl">
          {dict.equipe.subtitle}
        </p>
      </section>
      
      <div className="flex flex-col gap-section-gap">
        <section className="flex flex-col md:flex-row items-stretch gap-gutter fade-in-up group">
          <div className="w-full sm:w-3/4 md:w-2/5 lg:w-1/3 rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group shrink-0 mx-auto flex">
            <Image 
              src="/images/mavi.jpeg" 
              alt="Maria Victoria" 
              width={1066}
              height={1600}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#161308]/40 to-transparent pointer-events-none"></div>
          </div>
          <div className="w-full md:flex-1 flex flex-col justify-center gap-stack-lg glass-panel p-10 md:p-12 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-5 py-2 rounded-full mb-2">
              <span className="font-label-md text-base text-teko-yellow font-bold">{dict.equipe.mavi_role}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white">{dict.equipe.mavi_name}</h2>
            <p className="font-body-lg text-lg text-text-muted leading-relaxed">{dict.equipe.mavi_bio}</p>
            <div className="flex gap-3 flex-wrap mt-4">
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">UX/UI Design</span>
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">Product Strategy</span>
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">Brand Identity</span>
            </div>
          </div>
        </section>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-glass-border to-transparent opacity-50 fade-in-up"></div>
        
        <section className="flex flex-col md:flex-row-reverse items-stretch gap-gutter fade-in-up group">
          <div className="w-full sm:w-3/4 md:w-2/5 lg:w-1/3 rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group shrink-0 mx-auto flex">
            <Image 
              src="/images/carlos.jpeg" 
              alt="Carlos Eduardo" 
              width={1032}
              height={1548}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#161308]/40 to-transparent pointer-events-none"></div>
          </div>
          <div className="w-full md:flex-1 flex flex-col justify-center gap-stack-lg glass-panel p-10 md:p-12 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-5 py-2 rounded-full mb-2">
              <span className="font-label-md text-base text-teko-yellow font-bold">{dict.equipe.carlos_role}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white">{dict.equipe.carlos_name}</h2>
            <p className="font-body-lg text-lg text-text-muted leading-relaxed">{dict.equipe.carlos_bio}</p>
            <div className="flex gap-3 flex-wrap mt-4">
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">System Architecture</span>
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">AI Pipeline</span>
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">Security &amp; LGPD</span>
            </div>
          </div>
        </section>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-glass-border to-transparent opacity-50 fade-in-up"></div>
        
        <section className="flex flex-col md:flex-row items-stretch gap-gutter fade-in-up group">
          <div className="w-full sm:w-3/4 md:w-2/5 lg:w-1/3 rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group shrink-0 mx-auto flex">
            <Image 
              src="/images/miguel.jpeg" 
              alt="Miguel Rodrigues" 
              width={1032}
              height={1548}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#161308]/40 to-transparent pointer-events-none"></div>
          </div>
          <div className="w-full md:flex-1 flex flex-col justify-center gap-stack-lg glass-panel p-10 md:p-12 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-5 py-2 rounded-full mb-2">
              <span className="font-label-md text-base text-teko-yellow font-bold">{dict.equipe.miguel_role}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white">{dict.equipe.miguel_name}</h2>
            <p className="font-body-lg text-lg text-text-muted leading-relaxed">{dict.equipe.miguel_bio}</p>
            <div className="flex gap-3 flex-wrap mt-4">
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">Financial Strategy</span>
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">Data Analytics</span>
              <span className="inline-flex items-center glass-pill px-4 py-2 rounded-full text-sm text-white/80 border border-white/10">Algorithm Validation</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

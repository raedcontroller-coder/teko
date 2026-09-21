import Image from "next/image";
import { getDictionary } from "../../../dictionaries";

export default async function ValidacaoClinicaPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "pt") as "en" | "pt";
  const dict = await getDictionary(lang);

  return (
    <div className="flex-grow pt-[120px] pb-section-gap px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col gap-section-gap">
      {/* Super Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-stack-lg md:gap-gutter fade-in-up w-full">
        <div className="flex-1 flex flex-col gap-stack-md order-2 md:order-1">
          <div className="inline-flex self-start items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-2">
            <span className="material-symbols-outlined text-[#7B61FF] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="font-label-md text-sm text-white">{dict.validacao.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-display-lg-mobile md:font-display-lg text-white leading-[1.1] font-black">
            {dict.validacao.title_line1} <span className="text-teko-yellow">{dict.validacao.title_highlight1}</span> <br />
            {dict.validacao.title_line2} <br />
            <span className="text-[#7B61FF]">{dict.validacao.title_highlight2}</span>
          </h1>
          <p className="font-body-lg text-text-muted">
            {dict.validacao.subtitle}
          </p>
          <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-[#7B61FF] pl-4">
            <h3 className="font-headline-md font-bold text-on-surface">{dict.validacao.academic_title}</h3>
            <p className="font-body-md text-text-muted">
              {dict.validacao.academic_desc}
            </p>
          </div>
        </div>
        <div className="flex-1 w-full flex justify-center order-1 md:order-2">
          <div className="w-full max-w-[500px] aspect-square rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            <Image 
              src="/images/validacao-fundacao.webp"
              alt="Fundação Científica"
              fill
              className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(127,213,204,0.2)] to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Z-Pattern Layout for Dynamics */}
      <div className="flex flex-col gap-section-gap w-full">
        {/* Section 1: Text Left, Image Right */}
        <section className="flex flex-col md:flex-row items-center gap-stack-lg md:gap-gutter fade-in-up">
          <div className="flex-1 flex flex-col gap-stack-md order-2 md:order-1">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-teko-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>front_hand</span>
              <span className="font-label-md text-sm text-white">{dict.validacao.inibicao_badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              {dict.validacao.inibicao_title} <br/>
              <span className="text-[#7B61FF]">{dict.validacao.inibicao_sub}</span>
            </h2>
            <p className="font-body-lg text-text-muted">
              {dict.validacao.inibicao_desc}
            </p>
            <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-teko-yellow pl-4">
              <h4 className="font-headline-md font-bold text-on-surface">{dict.validacao.inibicao_metric_title}</h4>
              <p className="font-body-md text-text-muted">{dict.validacao.inibicao_metric_desc}</p>
            </div>
          </div>
          <div className="flex-1 w-full order-1 md:order-2">
            <div className="w-full aspect-video rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <Image 
                src="/images/validacao-inibicao.webp"
                alt="Desafio da Inibição"
                fill
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#161308]/60 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Section 2: Image Left, Text Right */}
        <section className="flex flex-col md:flex-row items-center gap-stack-lg md:gap-gutter fade-in-up">
          <div className="flex-1 w-full order-1">
            <div className="w-full aspect-video rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <Image 
                src="/images/validacao-labirinto.webp"
                alt="Labirintos Espaciais"
                fill
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#161308]/60 to-transparent pointer-events-none"></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-stack-md order-2">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-[#7B61FF] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
              <span className="font-label-md text-sm text-white">{dict.validacao.velocidade_badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              {dict.validacao.velocidade_title} <br/>
              <span className="text-[#7B61FF]">{dict.validacao.velocidade_sub}</span>
            </h2>
            <p className="font-body-lg text-text-muted">
              {dict.validacao.velocidade_desc}
            </p>
            <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-[#7B61FF] pl-4">
              <h4 className="font-headline-md font-bold text-on-surface">{dict.validacao.velocidade_metric_title}</h4>
              <p className="font-body-md text-text-muted">{dict.validacao.velocidade_metric_desc}</p>
            </div>
          </div>
        </section>

        {/* Section 3: Text Left, Image Right */}
        <section className="flex flex-col md:flex-row items-center gap-stack-lg md:gap-gutter fade-in-up">
          <div className="flex-1 flex flex-col gap-stack-md order-2 md:order-1">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-teko-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              <span className="font-label-md text-sm text-white">{dict.validacao.foco_badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              {dict.validacao.foco_title} <br/>
              <span className="text-teko-yellow">{dict.validacao.foco_sub}</span>
            </h2>
            <p className="font-body-lg text-text-muted">
              {dict.validacao.foco_desc}
            </p>
            <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-teko-yellow pl-4">
              <h4 className="font-headline-md font-bold text-on-surface">{dict.validacao.foco_metric_title}</h4>
              <p className="font-body-md text-text-muted">{dict.validacao.foco_metric_desc}</p>
            </div>
          </div>
          <div className="flex-1 w-full order-1 md:order-2">
            <div className="w-full aspect-video rounded-[2rem] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
              <Image 
                src="/images/validacao-foco.webp"
                alt="Foco Sustentado"
                fill
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#161308]/60 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

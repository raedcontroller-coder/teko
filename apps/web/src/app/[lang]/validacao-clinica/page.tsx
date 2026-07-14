import Image from "next/image";

export default function ValidacaoClinicaPage() {
  return (
    <div className="flex-grow pt-[120px] pb-section-gap px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto flex flex-col gap-section-gap">
      {/* Super Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-stack-lg md:gap-gutter fade-in-up w-full">
        <div className="flex-1 flex flex-col gap-stack-md order-2 md:order-1">
          <div className="inline-flex self-start items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-2">
            <span className="material-symbols-outlined text-[#7B61FF] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            <span className="font-label-md text-sm text-white">Fundação Científica</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-display-lg-mobile md:font-display-lg text-white leading-[1.1] font-black">
            A <span className="text-teko-yellow">Ciência</span> <br />
            por trás do <br />
            <span className="text-[#7B61FF]">Brincar.</span>
          </h1>
          <p className="font-body-lg text-text-muted">
            Nossos serious games transformam avaliações neuropsicológicas complexas em dados clínicos engajadores, oferecendo uma janela precisa para o desenvolvimento cognitivo infantil, sem a ansiedade dos testes tradicionais.
          </p>
          <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-[#7B61FF] pl-4">
            <h3 className="font-headline-md font-bold text-on-surface">Rigor Acadêmico, Prática Clínica.</h3>
            <p className="font-body-md text-text-muted">
              Todas as dinâmicas da Teko são estritamente baseadas em pesquisas de Mestrado e Doutorado, construindo uma ponte sólida entre a vanguarda do conhecimento acadêmico e as necessidades reais da prática clínica diária.
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
              <span className="font-label-md text-sm text-white">Controle Inibitório</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              Desafio <br/>
              <span className="text-teko-yellow">da Inibição</span> <br/>
              <span className="text-white/60 text-3xl">(Toca Rápido!)</span>
            </h2>
            <p className="font-body-lg text-text-muted">
              Nossa adaptação lúdica do paradigma &quot;Toca Rápido!&quot; mede com precisão o controle inibitório e o gerenciamento de impulsos. Ao transformar estímulos estáticos em desafios interativos, capturamos reações naturais que são fundamentais para avaliar a capacidade de autorregulação da criança em cenários do mundo real.
            </p>
            <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-teko-yellow pl-4">
              <h4 className="font-headline-md font-bold text-on-surface">Métrica Principal</h4>
              <p className="font-body-md text-text-muted">Impulsividade.</p>
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
              <span className="font-label-md text-sm text-white">Velocidade de Processamento</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              Metrificando o <br/>
              <span className="text-[#7B61FF]">tempo de resposta.</span> <br/>
              <span className="text-white/60 text-3xl">(Goleiro)</span>
            </h2>
            <p className="font-body-lg text-text-muted">
              Avalia a velocidade de processamento e a tomada de decisão sob pressão temporal. O Goleiro exige que a criança reaja rapidamente para interceptar chutes ao gol. Os dados coletados rastreiam, com precisão de milissegundos, o tempo de reação em cada defesa e a taxa de sucesso motora, mensurando a agilidade cognitiva de forma direta.
            </p>
            <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-[#7B61FF] pl-4">
              <h4 className="font-headline-md font-bold text-on-surface">Métrica Principal</h4>
              <p className="font-body-md text-text-muted">Velocidade no tempo de resposta.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Text Left, Image Right */}
        <section className="flex flex-col md:flex-row items-center gap-stack-lg md:gap-gutter fade-in-up">
          <div className="flex-1 flex flex-col gap-stack-md order-2 md:order-1">
            <div className="inline-flex self-start items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-2">
              <span className="material-symbols-outlined text-teko-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              <span className="font-label-md text-sm text-white">Atenção Sustentada</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display-lg-mobile md:font-display-lg text-white leading-[1.2] font-black">
              Foco <br/>
              <span className="text-teko-yellow">Sustentado.</span> <br/>
              <span className="text-white/60 text-3xl">(Fotógrafo da Floresta)</span>
            </h2>
            <p className="font-body-lg text-text-muted">
              Avalia a atenção sustentada e a capacidade de rastreamento visual. No Fotógrafo da Floresta, a criança explora um cenário interativo para localizar e &quot;fotografar&quot; animais específicos em meio a distratores. O sistema coleta dados precisos sobre a velocidade de descoberta, a quantidade de fotografias corretas e os falsos positivos (fotos incorretas), mapeando perfeitamente a capacidade de manter o foco prolongado e ignorar distrações.
            </p>
            <div className="flex flex-col gap-stack-sm mt-4 border-l-2 border-teko-yellow pl-4">
              <h4 className="font-headline-md font-bold text-on-surface">Métrica Principal</h4>
              <p className="font-body-md text-text-muted">Queda de atenção.</p>
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

import { ArrowRight, BrainCircuit, HeartHandshake, ShieldCheck, Gamepad2, LineChart, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-white flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--primary)]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-[var(--accent)] font-bold text-xl shadow-lg">
                T
              </div>
              <span className="font-bold text-2xl tracking-tight text-[var(--primary)]">Teko</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#solucao" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">A Solução</a>
              <a href="#modulos" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Módulos</a>
              <a href="#beneficios" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">Benefícios</a>
            </nav>
            <div className="flex items-center gap-4">
              <button className="hidden md:block text-sm font-semibold text-[var(--primary)] hover:text-[var(--foreground)] transition-colors">Login</button>
              <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#0f4a45] transition-all flex items-center gap-2">
                Começar agora <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/20 text-[var(--primary)] text-sm font-semibold mb-4 border border-[var(--accent)]/50">
              <ShieldCheck size={16} /> <span>Validado Internacionalmente</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance text-[var(--primary)]">
              Avaliação Psicológica que <span className="text-[var(--accent)]">parece brincadeira.</span>
            </h1>
            <p className="text-xl text-[var(--foreground)]/80 max-w-2xl mx-auto leading-relaxed">
              O Teko transforma avaliações clínicas infantis em jogos lúdicos. Receba dados estruturados antes mesmo da primeira sessão, sem que a criança perceba que está sendo avaliada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <button className="bg-[var(--primary)] text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:-translate-y-1 transition-all">
                Conhecer a Plataforma
              </button>
              <button className="bg-white border-2 border-[var(--primary)]/20 text-[var(--primary)] px-8 py-4 rounded-full text-lg font-bold hover:bg-[var(--primary)]/5 transition-all">
                Falar com Consultor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* THREE MODULES SECTION */}
      <section id="modulos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)]">Uma Plataforma, Três Visões</h2>
            <p className="mt-4 text-lg text-[var(--foreground)]/70 max-w-2xl mx-auto">Experiências dedicadas e focadas nas necessidades de cada envolvido no acompanhamento psicológico infantil.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-[var(--background)] p-8 rounded-3xl border border-[var(--primary)]/10 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-[var(--accent)] text-[var(--primary)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gamepad2 size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-3">A Criança</h3>
              <p className="text-[var(--foreground)]/80 leading-relaxed">
                Interface lúdica com narrativas interativas. Coleta dados comportamentais como prosódia, tempo de resposta e padrões faciais de forma invisível durante as dinâmicas e jogos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[var(--primary)] p-8 rounded-3xl text-white hover:shadow-xl transition-all shadow-[0_4px_20px_rgba(20,98,91,0.2)] transform md:-translate-y-4">
              <div className="w-14 h-14 bg-white/10 text-[var(--accent)] rounded-2xl flex items-center justify-center mb-6">
                <LineChart size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">O Psicólogo</h3>
              <p className="text-white/80 leading-relaxed">
                Dashboard profissional que gera mapas comportamentais estruturados baseados no CBCL, SDQ e WISC-V antes mesmo do paciente entrar no consultório.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[var(--background)] p-8 rounded-3xl border border-[var(--primary)]/10 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-[var(--accent)] text-[var(--primary)] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-[var(--primary)] mb-3">A Família</h3>
              <p className="text-[var(--foreground)]/80 leading-relaxed">
                Painel simplificado sem jargões clínicos. Demonstra a evolução do tratamento e fornece orientações práticas de engajamento baseadas nas sessões.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION / BENEFÍCIOS */}
      <section id="beneficios" className="py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-[var(--primary)]">
                Por que escolher o <span className="text-[var(--accent)]">Teko?</span>
              </h2>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                    <BrainCircuit size={18} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--primary)]">Pule as sessões de mapeamento iniciais</h4>
                  <p className="mt-2 text-[var(--foreground)]/80">Crianças possuem dificuldade em verbalizar. Obtenha dados estruturados automaticamente através dos jogos, reduzindo custos e acelerando o diagnóstico.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                    <HeartHandshake size={18} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--primary)]">A primeira sessão já é intervenção</h4>
                  <p className="mt-2 text-[var(--foreground)]/80">Ofereça para os pais um diferencial claro: menos sessões gastas com perguntas sem respostas, mais tempo com acompanhamento psicológico focado.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-[var(--primary)]/5 rounded-[3rem] p-8 border border-[var(--primary)]/10 shadow-2xl overflow-hidden relative">
                {/* Abstract mockup representation */}
                <div className="absolute inset-x-8 top-12 bottom-0 bg-white rounded-t-2xl shadow-xl border border-b-0 border-[var(--primary)]/10 p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-6 w-32 bg-[var(--primary)]/20 rounded-full animate-pulse"></div>
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)]"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/10"></div>
                    <div className="h-24 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/10"></div>
                  </div>
                  <div className="h-40 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/10 w-full mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="bg-[var(--primary)] text-[var(--primary-foreground)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">Transforme sua clínica hoje.</h2>
          <p className="text-white/80 max-w-2xl mx-auto text-lg">Faça parte do grupo de profissionais que está redefinindo a Psicologia Infantil.</p>
          <button className="bg-[var(--accent)] text-[var(--primary)] px-8 py-4 rounded-full text-xl font-bold shadow-xl hover:-translate-y-1 transition-all mt-8">
            Solicitar Acesso Antecipado
          </button>
          <div className="pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-white/50">
            <p>&copy; 2026 Teko. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

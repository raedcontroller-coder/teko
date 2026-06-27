import Link from "next/link";
import Image from "next/image";

export default async function CadastroPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop min-h-screen py-8 relative">
      {/* Back Button */}
      <Link 
        href={`/${lang}`} 
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-3 group z-50"
      >
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 group-hover:text-teko-yellow group-hover:border-teko-yellow group-hover:bg-black/40 transition-all duration-300 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </div>
        <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg pointer-events-none">
          <span className="font-label-md text-sm text-white/90 whitespace-nowrap">
            Voltar para Início
          </span>
        </div>
      </Link>
      <main className="w-full max-w-[500px] z-10 fade-in-up">
        {/* Glassmorphism Card */}
        <div className="glass-panel rounded-[2rem] p-stack-lg md:p-12 flex flex-col items-center">
          {/* Brand Icon */}
          <div className="mb-stack-lg w-24 h-24 rounded-[2rem] overflow-hidden border-[4px] border-white/10 p-0 bg-surface-container-low shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <Link href="/" className="hover:scale-105 transition-transform duration-500 block w-full h-full">
              <Image
                alt="Teko Brand Icon"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                src="/images/teko_icone.jpeg"
              />
            </Link>
          </div>

          {/* Header Text */}
          <div className="text-center mb-stack-lg">
            <h1 className="font-headline-lg text-3xl font-black text-white mb-2">Criar sua conta</h1>
            <p className="text-white/70 font-body-md">Inicie sua jornada com a Teko!</p>
          </div>

          {/* Registration Form */}
          <form className="w-full space-y-stack-md">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="full_name">Nome Completo</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">person</span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                  id="full_name"
                  name="full_name"
                  placeholder="Ex: Dr. João Silva"
                  type="text"
                />
              </div>
            </div>

            {/* Professional Email (CRP) */}
            <div className="space-y-1">
              <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="email">E-mail</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">badge</span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                  id="email"
                  name="email"
                  placeholder="nome@psicologo.com.br"
                  type="email"
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1">
                <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="password">Senha</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">lock</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="confirm_password">Confirmar senha</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">check_circle</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                    id="confirm_password"
                    name="confirm_password"
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mt-4 px-1">
              <input
                className="mt-1 w-5 h-5 rounded border-white/20 bg-black/20 text-teko-yellow focus:ring-teko-yellow/50 transition-colors cursor-pointer"
                id="terms"
                type="checkbox"
              />
              <label className="text-sm text-white/70 leading-tight cursor-pointer" htmlFor="terms">
                Eu concordo com os <Link className="text-teko-yellow hover:underline" href="#">Termos de Serviço</Link> e a <Link className="text-teko-yellow hover:underline" href="#">Política de Privacidade</Link>.
              </label>
            </div>

            {/* Submit Button */}
            <button className="w-full mt-stack-lg py-4 rounded-xl bg-teko-yellow text-deep-forest font-cta-lg font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(230,168,0,0.2)] hover:shadow-[0_0_30px_rgba(230,168,0,0.4)]" type="submit">
              Cadastrar Agora
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-stack-lg pt-stack-md border-t border-white/10 w-full text-center">
            <p className="text-white/70 font-body-md">
              Já possui uma conta?
              <Link className="text-[#7B61FF] font-bold hover:text-teko-yellow transition-colors ml-2" href={`/${lang}/login`}>
                Entrar
              </Link>
            </p>
          </div>
        </div>

        {/* System Status Labels */}
        <div className="mt-stack-lg flex justify-center gap-stack-md opacity-60">
          {/* <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-glass-surface border border-white/10 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Servidores Online
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-glass-surface border border-white/10 text-xs text-white">
            <span className="material-symbols-outlined text-[14px]">encrypted</span>
            SSL 256-bit
          </div> */}
        </div>
      </main>
    </div>
  );
}

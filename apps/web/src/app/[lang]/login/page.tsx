import Link from "next/link";
import Image from "next/image";

import LoginForm from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
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
            <h1 className="font-headline-lg text-3xl font-black text-white mb-2">Bem-vindo(a) de volta</h1>
            <p className="text-white/70 font-body-md">Acesse sua jornada terapêutica digital.</p>
          </div>

          <LoginForm />

          {/* Footer Link */}
          <div className="mt-stack-lg pt-stack-md border-t border-white/10 w-full text-center">
            <p className="text-white/70 font-body-md">
              Não tem uma conta?
              <Link className="text-[#7B61FF] font-bold hover:text-teko-yellow transition-colors ml-2" href={`/${lang}/cadastro`}>
                Criar uma conta
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

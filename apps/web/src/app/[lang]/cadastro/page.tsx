"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { publicRegisterAction } from "../../../actions/auth";

export default function CadastroPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [crpValue, setCrpValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleCrpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digits
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 7 digits
    if (value.length > 7) {
      value = value.slice(0, 7);
    }
    
    // Add the slash after the first 2 digits
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    
    setCrpValue(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    // Client-side validation for empty/spaces
    const fullName = (formData.get("full_name") as string)?.trim();
    const password = (formData.get("password") as string)?.trim();
    const rawClinicName = formData.get("clinicName") as string;
    
    if (!fullName) {
      setError("O nome não pode estar vazio ou conter apenas espaços.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("A senha não pode estar vazia ou conter apenas espaços.");
      setLoading(false);
      return;
    }

    if (rawClinicName && rawClinicName.trim().length === 0) {
      setError("O nome da clínica não pode conter apenas espaços.");
      setLoading(false);
      return;
    }

    const result = await publicRegisterAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setShowSuccessPopup(true);
      setTimeout(() => {
        router.push(`/${lang}/dashboard`);
      }, 4000);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop min-h-screen py-8 relative">
      
      {/* Success Popup Overlay */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"></div>
          <div className="bg-[#161308] border border-teko-yellow/30 shadow-[0_0_60px_rgba(230,168,0,0.2)] rounded-3xl w-full max-w-md p-10 relative z-10 animate-fade-up text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-teko-yellow/10 flex items-center justify-center border-2 border-teko-yellow/50 mb-6 relative">
              <span className="material-symbols-outlined text-4xl text-teko-yellow">check_circle</span>
              <svg className="absolute inset-0 w-full h-full text-teko-yellow animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="300" strokeDashoffset="0" className="opacity-50" />
              </svg>
            </div>
            <h2 className="font-headline-lg text-2xl font-bold text-white mb-2">Conta Criada!</h2>
            <p className="text-white/70 font-body-md mb-8">
              Preparando o seu ambiente de trabalho... Você será redirecionado em instantes.
            </p>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-teko-yellow w-full origin-left animate-[scale-x_4s_linear_forwards]" style={{ animationName: 'scaleX' }}></div>
            </div>
            <style jsx>{`
              @keyframes scaleX {
                from { transform: scaleX(0); }
                to { transform: scaleX(1); }
              }
            `}</style>
          </div>
        </div>
      )}

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
          <form onSubmit={handleSubmit} className="w-full space-y-stack-md">
            
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 text-white rounded-xl font-body-md animate-fade-in text-center">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="full_name">Nome Completo *</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">person</span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                  id="full_name"
                  name="full_name"
                  required
                  placeholder="Ex: Dr. João Silva"
                  type="text"
                />
              </div>
            </div>

            {/* Professional Email (CRP) */}
            <div className="space-y-1">
              <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="email">E-mail *</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">badge</span>
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                  id="email"
                  name="email"
                  required
                  placeholder="nome@psicologo.com.br"
                  type="email"
                />
              </div>
            </div>

            {/* CRP & Clinic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="crp">CRP <span className="text-white/50 text-xs">(Opcional)</span></label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">id_card</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                    id="crp"
                    name="crp"
                    value={crpValue}
                    onChange={handleCrpChange}
                    maxLength={8}
                    placeholder="00/00000"
                    type="text"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="clinicName">Nome da Clínica <span className="text-white/50 text-xs">(Opcional)</span></label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">domain</span>
                  <input
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                    id="clinicName"
                    name="clinicName"
                    placeholder="Clínica Mente Viva"
                    type="text"
                  />
                </div>
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1">
                <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="password">Senha *</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">lock</span>
                  <input
                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                    id="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-teko-yellow transition-colors flex items-center justify-center outline-none"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="confirm_password">Confirmar senha *</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">check_circle</span>
                  <input
                    className="w-full pl-12 pr-12 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
                    id="confirm_password"
                    name="confirm_password"
                    required
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-teko-yellow transition-colors flex items-center justify-center outline-none"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mt-4 px-1">
              <input
                className="mt-1 w-5 h-5 rounded border-white/20 bg-black/20 text-teko-yellow focus:ring-teko-yellow/50 transition-colors cursor-pointer"
                id="terms"
                required
                type="checkbox"
              />
              <label className="text-sm text-white/70 leading-tight cursor-pointer" htmlFor="terms">
                Eu concordo com os <Link className="text-teko-yellow hover:underline" href="#">Termos de Serviço</Link> e a <Link className="text-teko-yellow hover:underline" href="#">Política de Privacidade</Link>.
              </label>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full mt-stack-lg py-4 rounded-xl bg-teko-yellow text-[#084D48] font-cta-lg font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(230,168,0,0.2)] hover:shadow-[0_0_30px_rgba(230,168,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100" 
              type="submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Criando sua conta...
                </>
              ) : (
                <>
                  Cadastrar Agora
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
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
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, UserCircle, Briefcase } from "lucide-react";
import { registerPsicologoAction } from "../../../../../actions/admin";

export default function NovoPsicologoPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params?.lang as string || "pt";
  const backUrl = `/${lang}/dashboard/admin/profissionais`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [crp, setCrp] = useState("");

  const handleCrpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    setCrp(value);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerPsicologoAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      router.push(backUrl);
      router.refresh();
    }
  }

  return (
    <div className="w-full pb-16 animate-fade-in max-w-5xl mx-auto space-y-6 relative">
      <Link href={backUrl} className="inline-flex items-center gap-2 text-white hover:gap-3 hover:text-teko-yellow transition-all font-label-md group mb-8">
        <ArrowLeft size={20} />
        Voltar para Meus profissionais
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 text-white rounded-xl font-body-md animate-fade-in">
            {error}
          </div>
        )}

        {/* Dados Pessoais e Acesso */}
        <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <UserCircle size={120} className="text-white" />
            </div>
            
            <div className="flex flex-col items-center md:items-start md:flex-row gap-8 relative z-10">
              <div className="w-32 h-32 rounded-full bg-[#FFF6E3]/5 backdrop-blur-md flex items-center justify-center border-2 border-teko-yellow shadow-[0_0_20px_rgba(230,168,0,0.3)] shrink-0">
                <UserCircle size={64} className="text-teko-yellow drop-shadow-[0_0_15px_rgba(230,168,0,0.8)]" />
              </div>
              
              <div className="flex-1 space-y-8 w-full">
                <div>
                  <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Credenciais de Acesso</h1>
                  <p className="text-white/80 font-body-md opacity-80">Defina o nome, e-mail e a senha temporária do profissional.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Nome Completo *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Ex: Dra. Ana Souza"
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">E-mail de Acesso *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="ana@clinica.com"
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Senha Temporária *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="******"
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informações Profissionais (Opcionais) */}
        <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Briefcase size={120} className="text-white" />
            </div>
            
            <div className="flex flex-col items-center md:items-start md:flex-row gap-8 relative z-10">
              <div className="w-32 h-32 rounded-full bg-[#FFF6E3]/5 backdrop-blur-md flex items-center justify-center border-2 border-[#7B61FF] shadow-[0_0_20px_rgba(123,97,255,0.3)] shrink-0">
                <Briefcase size={64} className="text-[#7B61FF] drop-shadow-[0_0_15px_rgba(123,97,255,0.8)]" />
              </div>
              
              <div className="flex-1 space-y-8 w-full">
                <div>
                  <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Informações Profissionais</h1>
                  <p className="text-white/80 font-body-md opacity-80">Dados adicionais para identificação (Opcionais).</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">CRP (Opcional)</label>
                    <input
                      type="text"
                      name="crp"
                      value={crp}
                      onChange={handleCrpChange}
                      placeholder="00/00000"
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Nome da Clínica (Opcional)</label>
                    <input
                      type="text"
                      name="clinicName"
                      placeholder="Clínica Mente Viva"
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-8 flex justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <button 
            type="submit" 
            disabled={loading} 
            className="bg-teko-yellow text-[#084D48] px-12 py-5 rounded-full font-bold text-lg hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_24px_rgba(123,97,255,0.5)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {loading ? "Cadastrando..." : "Cadastrar Profissional"}
          </button>
        </div>
      </form>
    </div>
  );
}

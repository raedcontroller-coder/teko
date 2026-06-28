"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, Save, Baby } from "lucide-react";

export default function NovoPacientePage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.guardianName) {
      alert("Por favor, preencha pelo menos o nome do paciente e o nome do responsável.");
      return;
    }
    alert(`Paciente ${formData.name} cadastrado com sucesso! (Mock)`);
    router.push(`/${lang}/dashboard/pacientes`);
  };

  return (
    <div className="w-full pb-16 animate-fade-in max-w-5xl mx-auto space-y-6 relative">
      <Link href={`/${lang}/dashboard/pacientes`} className="inline-flex items-center gap-2 text-white hover:gap-3 hover:text-teko-yellow transition-all font-label-md group mb-8">
        <ArrowLeft size={20} />
        Voltar para Meus Pacientes
      </Link>

      <div className="space-y-6">
        {/* Identificação do Paciente */}
        <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Baby size={120} className="text-white" />
            </div>
            
            <div className="flex flex-col items-center md:items-start md:flex-row gap-8 relative z-10">
              <div className="w-32 h-32 rounded-full bg-[#FFF6E3]/5 backdrop-blur-md flex items-center justify-center border-2 border-teko-yellow shadow-[0_0_20px_rgba(230,168,0,0.3)] shrink-0">
                <User size={64} className="text-teko-yellow drop-shadow-[0_0_15px_rgba(230,168,0,0.8)]" />
              </div>
              
              <div className="flex-1 space-y-8 w-full">
                <div>
                  <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Dados da Criança</h1>
                  <p className="text-white/80 font-body-md opacity-80">Preencha as informações básicas do novo paciente.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Nome do Paciente</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Ex: Joãozinho"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Idade</label>
                    <input
                      type="text"
                      name="age"
                      placeholder="Ex: 7 Anos"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Gênero</label>
                    <input
                      type="text"
                      name="gender"
                      placeholder="Ex: Masculino"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dados do Responsável */}
        <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Shield size={120} className="text-white" />
            </div>
            
            <div className="flex flex-col items-center md:items-start md:flex-row gap-8 relative z-10">
              <div className="w-32 h-32 rounded-full bg-[#FFF6E3]/5 backdrop-blur-md flex items-center justify-center border-2 border-[#7B61FF] shadow-[0_0_20px_rgba(123,97,255,0.3)] shrink-0">
                <Shield size={64} className="text-[#7B61FF] drop-shadow-[0_0_15px_rgba(123,97,255,0.8)]" />
              </div>
              
              <div className="flex-1 space-y-8 w-full">
                <div>
                  <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Ficha do(a) responsável</h1>
                  <p className="text-white/80 font-body-md opacity-80">Informações de contato para vínculo do aplicativo.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Nome do Responsável</label>
                    <input
                      type="text"
                      name="guardianName"
                      placeholder="Ex: Maria Silva"
                      value={formData.guardianName}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Email</label>
                    <input
                      type="email"
                      name="guardianEmail"
                      placeholder="maria@email.com"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Telefone de Contato</label>
                    <input
                      type="text"
                      name="guardianPhone"
                      placeholder="(11) 99999-9999"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </section>

        <div className="pt-8 flex justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <button onClick={handleSave} className="bg-teko-yellow text-[#084D48] px-12 py-5 rounded-full font-bold text-lg hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_24px_rgba(123,97,255,0.5)] transition-all flex items-center gap-3 active:scale-95">
            <Save size={24} /> Cadastrar Paciente
          </button>
        </div>

      </div>
    </div>
  );
}

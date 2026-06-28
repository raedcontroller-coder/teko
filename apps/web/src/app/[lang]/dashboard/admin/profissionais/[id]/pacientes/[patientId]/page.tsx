"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Shield, Target, Puzzle, Bomb, Save, Baby } from "lucide-react";

export default function AdminPacientePerfilPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "pt";
  const id = params?.id as string; // psychologist ID
  const patientId = params?.patientId as string;

  // Mock initial state
  const initialData = {
    name: patientId === "1" ? "Lucas M." : "Mariana S.",
    age: patientId === "1" ? "7 Anos" : "6 Anos",
    gender: patientId === "1" ? "Masculino" : "Feminino",
    guardianName: "Ana Silva",
    guardianEmail: "ana.silva@email.com",
    guardianPhone: "(11) 98765-4321",
  };

  const [formData, setFormData] = useState(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePatient = () => {
    alert("Dados do paciente salvos com sucesso!");
  };

  const handleSaveGuardian = () => {
    alert("Dados do responsável salvos com sucesso!");
  };

  return (
    <div className="w-full pb-16 animate-fade-in">
      <Link href={`/${lang}/dashboard/admin/profissionais/${id}/pacientes`} className="inline-flex items-center gap-2 text-white hover:gap-3 hover:text-teko-yellow transition-all font-label-md group mb-8">
        <ArrowLeft size={20} />
        Voltar para Lista de Pacientes do Profissional
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Identificação do Paciente */}
        <section className="lg:col-span-12 animate-fade-up" style={{ animationDelay: '0.1s' }}>
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
                  <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Ficha do Paciente (Administrador)</h1>
                  <p className="text-white/80 font-body-md opacity-80">Gestão de perfil clínico e informações básicas do desenvolvimento.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Nome do Paciente</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Idade</label>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Gênero</label>
                    <input
                      type="text"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button onClick={handleSavePatient} className="bg-teko-yellow text-[#084D48] px-10 py-4 rounded-full font-bold hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_14px_rgba(123,97,255,0.39)] transition-all flex items-center gap-3">
                    <Save size={20} /> Salvar Paciente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Avaliações Clínicas */}
        <section className="lg:col-span-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Avaliações Clínicas</h2>
              <span className="px-3 py-1 bg-[#7B61FF]/10 text-[#7B61FF] text-sm font-bold rounded-full border border-[#7B61FF]/20">3 Atividades Ativas</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 rounded-xl p-8 text-center group cursor-pointer hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-[#7B61FF]/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Target size={32} className="text-[#7B61FF]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Go/No-Go</h3>
                <p className="text-sm text-white/70 mb-4">Controle inibitório e impulsividade.</p>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/50 group-hover:border-white/20 transition-colors">
                  Ainda não jogou
                </div>
              </div>
              
              <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 rounded-xl p-8 text-center group cursor-pointer hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-teko-yellow/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Puzzle size={32} className="text-teko-yellow" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Quebra-Cabeça</h3>
                <p className="text-sm text-white/70 mb-4 whitespace-nowrap">Lógica e percepção espacial.</p>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/50 group-hover:border-white/20 transition-colors">
                  Ainda não jogou
                </div>
              </div>
              
              <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 rounded-xl p-8 text-center group cursor-pointer hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Bomb size={32} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Jogo da Bomba</h3>
                <p className="text-sm text-white/70 mb-4">Tomada de decisão sob pressão.</p>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/50 group-hover:border-white/20 transition-colors">
                  Ainda não jogou
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dados do Responsável */}
        <section className="lg:col-span-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
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
                  <p className="text-white/80 font-body-md opacity-80">Informações de contato e segurança do paciente.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Nome do Responsável</label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Email</label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Telefone de Contato</label>
                    <input
                      type="text"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button onClick={handleSaveGuardian} className="bg-[#7B61FF] text-white px-10 py-4 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
                    <Save size={20} /> Salvar Responsável
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

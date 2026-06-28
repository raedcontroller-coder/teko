"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, Save, Baby, Loader2, CheckCircle2 } from "lucide-react";
import { createPatientAction } from "@/actions/patients";

export default function AdminNovoPacientePage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";
  const id = params?.id as string; // psychologist ID

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "guardianPhone") {
      let v = value.replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d)(\d{4})$/, "$1-$2");
      setFormData((prev) => ({ ...prev, [name]: v }));
    } else if (name === "age") {
      let v = value.replace(/\D/g, "");
      if (v.length > 3) v = v.slice(0, 3);
      setFormData((prev) => ({ ...prev, [name]: v }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setErrorMsg("");
    if (!formData.name || !formData.age || !formData.gender || !formData.guardianName || !formData.guardianEmail || !formData.guardianPhone) {
      setErrorMsg("Todos os campos são obrigatórios.");
      return;
    }

    setIsLoading(true);
    
    // We create a FormData object to pass to the server action
    const data = new FormData();
    data.append("name", formData.name);
    data.append("age", formData.age);
    data.append("gender", formData.gender);
    data.append("guardianName", formData.guardianName);
    data.append("guardianEmail", formData.guardianEmail);
    data.append("guardianPhone", formData.guardianPhone);

    const res = await createPatientAction(data, id);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsSuccessModalOpen(true);
      
      // Reset the form so they can add another child, keeping the guardian info
      setFormData({
        name: "",
        age: "",
        gender: "",
        guardianName: formData.guardianName,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
      });
      
      setTimeout(() => {
        setIsSuccessModalOpen(false);
      }, 4000);
    }
  };

  return (
    <div className="w-full pb-16 animate-fade-in max-w-5xl mx-auto space-y-6 relative">
      <Link href={`/${lang}/dashboard/admin/profissionais/${id}/pacientes`} className="inline-flex items-center gap-2 text-white hover:gap-3 hover:text-teko-yellow transition-all font-label-md group mb-8">
        <ArrowLeft size={20} />
        Voltar para Lista de Pacientes
      </Link>

      <div className="space-y-6">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl font-bold animate-fade-up">
            {errorMsg}
          </div>
        )}

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
                  <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Dados da Criança (Administrador)</h1>
                  <p className="text-white/80 font-body-md opacity-80">Cadastre um novo paciente para este psicólogo.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Nome do Paciente</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="João"
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
                      placeholder="Ex: 7"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-teko-yellow opacity-80 block">Gênero</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-white/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-black bg-white">Selecione...</option>
                      <option value="Masculino" className="text-black bg-white">Masculino</option>
                      <option value="Feminino" className="text-black bg-white">Feminino</option>
                      <option value="Prefiro não dizer" className="text-black bg-white">Prefiro não dizer</option>
                    </select>
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
                    <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      name="guardianPhone"
                      placeholder="(11) 99999-9999"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      maxLength={15}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </section>

        <div className="pt-8 flex justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <button onClick={handleSave} disabled={isLoading} className="bg-teko-yellow text-[#084D48] px-12 py-5 rounded-full font-bold text-lg hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_24px_rgba(123,97,255,0.5)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            {isLoading ? "Salvando..." : "Cadastrar Paciente"}
          </button>
        </div>

      </div>

      {isSuccessModalOpen && (
        <div className="fixed top-8 right-8 z-50 animate-fade-left">
          <div className="bg-[#FFF6E3]/10 border border-white/20 backdrop-blur-xl rounded-xl p-6 pr-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-5 min-w-[360px]">
            <div className="w-12 h-12 bg-[#7B61FF]/20 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={28} className="text-[#7B61FF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold font-headline-md text-white text-base mb-1">
                Sucesso!
              </h3>
              <p className="text-white/80 font-body-md text-sm">
                Paciente cadastrado.
              </p>
            </div>
            {/* Progress bar invisível/sutil apenas para tempo */}
            <div className="absolute bottom-0 left-0 h-1 bg-[#7B61FF] rounded-b-xl transition-all ease-linear" 
              style={{ width: '0%', transitionDuration: '4000ms' }}
              ref={(el) => {
                if (el) setTimeout(() => { el.style.width = '100%' }, 50);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}

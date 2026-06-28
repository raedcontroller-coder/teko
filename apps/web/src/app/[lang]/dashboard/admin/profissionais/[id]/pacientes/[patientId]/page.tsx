"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Shield, Target, Puzzle, Bomb, Save, Baby, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { getPatientByIdAction, updatePatientAction, updateGuardianAction, deletePatientAction } from "@/actions/patients";

export default function AdminPacientePerfilPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";
  const id = params?.id as string; // psychologist ID
  const patientId = params?.patientId as string;

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
  });

  const [guardianId, setGuardianId] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [isSavingGuardian, setIsSavingGuardian] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorToast, setErrorToast] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(""), 4000);
  };

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  useEffect(() => {
    const fetchPatient = async () => {
      const res = await getPatientByIdAction(patientId, id);
      if (res.error || !res.data?.patient) {
        showError("Paciente não encontrado.");
      } else {
        setFormData({
          name: res.data.patient.name,
          age: res.data.patient.age || "",
          gender: res.data.patient.gender || "",
          guardianName: res.data.guardian?.name || "",
          guardianEmail: res.data.guardian?.email || "",
          guardianPhone: res.data.guardian?.phone || "",
        });
        if (res.data.guardian?.id) {
          setGuardianId(res.data.guardian.id);
        }
      }
      setIsLoading(false);
    };
    fetchPatient();
  }, [patientId, id]);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await deletePatientAction(patientId, id);
    if (res.error) {
      showError(res.error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    } else {
      setIsDeleteModalOpen(false);
      router.push(`/${lang}/dashboard/admin/profissionais/${id}/pacientes`);
    }
  };

  const handleSavePatient = async () => {
    setIsSavingPatient(true);
    const res = await updatePatientAction(patientId, {
      name: formData.name,
      age: formData.age,
      gender: formData.gender
    }, id);
    setIsSavingPatient(false);

    if (res.error) showError(res.error);
    else showSuccess("Dados da criança atualizados com sucesso!");
  };

  const handleSaveGuardian = async () => {
    if (!guardianId) {
      showError("Responsável não encontrado.");
      return;
    }
    setIsSavingGuardian(true);
    const res = await updateGuardianAction(guardianId, {
      name: formData.guardianName,
      email: formData.guardianEmail,
      phone: formData.guardianPhone
    }, id);
    setIsSavingGuardian(false);

    if (res.error) showError(res.error);
    else showSuccess("Dados do responsável atualizados com sucesso!");
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
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-black bg-white">Selecione...</option>
                      <option value="Masculino" className="text-black bg-white">Masculino</option>
                      <option value="Feminino" className="text-black bg-white">Feminino</option>
                      <option value="Prefiro não dizer" className="text-black bg-white">Prefiro não dizer</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-8 flex justify-between items-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)} 
                    className="text-red-400 border border-red-500/30 bg-red-500/10 px-6 py-4 rounded-full font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Excluir Paciente
                  </button>
                  
                  <button onClick={handleSavePatient} disabled={isSavingPatient} className="bg-teko-yellow text-[#084D48] px-10 py-4 rounded-full font-bold hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_14px_rgba(123,97,255,0.39)] transition-all flex items-center gap-3 disabled:opacity-50">
                    {isSavingPatient ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSavingPatient ? "Salvando..." : "Salvar Paciente"}
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
                
                <div className="pt-4">
                  <button onClick={handleSaveGuardian} disabled={isSavingGuardian} className="bg-[#7B61FF] text-white px-10 py-4 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                    {isSavingGuardian ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSavingGuardian ? "Salvando..." : "Salvar Responsável"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          
          <div className="bg-[#161308] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] rounded-2xl w-full max-w-sm p-8 relative z-10 animate-fade-up">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Excluir Paciente</h2>
                <p className="text-white/70 text-sm mb-4">
                  Tem certeza que deseja excluir o paciente <strong>{formData.name}</strong>?
                </p>
                
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-left">
                  <p className="text-red-400 text-sm font-bold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Ação Irreversível
                  </p>
                  <p className="text-white/80 text-xs mb-2">Você perderá permanentemente:</p>
                  <ul className="text-white/60 text-xs list-disc pl-5 space-y-1">
                    <li>Todos os dados de perfil da criança</li>
                    <li>O histórico de progresso nos jogos</li>
                    <li>Todos os relatórios clínicos gerados</li>
                    <li>O vínculo com o responsável</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4 w-full pt-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold transition-all">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex justify-center items-center disabled:opacity-50">
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : "Sim, Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {successToast && (
        <div className="fixed top-8 right-8 z-[200] animate-fade-left">
          <div className="bg-[#FFF6E3]/10 border border-white/20 backdrop-blur-xl rounded-xl p-6 pr-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-5 min-w-[360px]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#7B61FF]/20">
              <CheckCircle2 size={28} className="text-[#7B61FF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold font-headline-md text-white text-base mb-1">Sucesso!</h3>
              <p className="text-white/80 font-body-md text-sm">{successToast}</p>
            </div>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="fixed top-8 right-8 z-[200] animate-fade-left">
          <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-xl rounded-xl p-6 pr-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-5 min-w-[360px]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-500/20">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold font-headline-md text-red-400 text-base mb-1">Atenção</h3>
              <p className="text-white/80 font-body-md text-sm">{errorToast}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

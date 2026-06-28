"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserCircle, Lock, Save, AlertTriangle, XCircle, Trash2, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { getPsicologoByIdAction, updatePsicologoAction, updatePsicologoPasswordAction, deletePsicologoAction } from "@/actions/admin";

export default function AdminProfissionalDadosPage() {
  const params = useParams();
  const lang = params?.lang as string || "pt";

  const router = useRouter();
  const psicologoId = params?.id as string;

  const [personalData, setPersonalData] = useState({
    name: "",
    email: "",
    crp: "",
    clinicName: "",
  });

  const [securityData, setSecurityData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
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
    const fetchPsi = async () => {
      const res = await getPsicologoByIdAction(psicologoId);
      if (res.error || !res.data) {
        showError("Profissional não encontrado.");
      } else {
        setPersonalData({
          name: res.data.name,
          email: res.data.email,
          crp: res.data.crp || "",
          clinicName: res.data.clinicName || "",
        });
      }
      setIsLoading(false);
    };
    fetchPsi();
  }, [psicologoId]);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    
    if (name === "crp") {
      value = value.replace(/\D/g, "");
      if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2, 7)}`;
      }
    }
    
    setPersonalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);
    const res = await updatePsicologoAction(psicologoId, {
      name: personalData.name,
      email: personalData.email,
      crp: personalData.crp,
      clinicName: personalData.clinicName
    });
    setIsSavingPersonal(false);
    if (res.error) showError(res.error);
    else showSuccess("Dados atualizados com sucesso!");
  };

  const handleSaveSecurity = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      showError("A nova senha e a confirmação não conferem.");
      return;
    }
    if (securityData.newPassword.length < 6) {
      showError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    
    setIsSavingSecurity(true);
    const res = await updatePsicologoPasswordAction(psicologoId, securityData.newPassword);
    setIsSavingSecurity(false);
    
    if (res.error) showError(res.error);
    else {
      showSuccess("Senha atualizada com sucesso!");
      setSecurityData({ newPassword: "", confirmPassword: "" });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await deletePsicologoAction(psicologoId);
    if (res.error) {
      showError(res.error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    } else {
      setIsDeleteModalOpen(false);
      router.push(`/${lang}/dashboard/admin/profissionais`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full pb-16 flex justify-center items-center h-64">
        <Loader2 size={40} className="animate-spin text-teko-yellow" />
      </div>
    );
  }

  return (
    <div className="w-full pb-16 animate-fade-in max-w-5xl mx-auto space-y-6 relative">
      <div className="mb-6">
        <Link href={`/${lang}/dashboard/admin/profissionais`}>
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <ArrowLeft size={18} />
            <span className="font-bold text-sm">Voltar para Profissionais</span>
          </button>
        </Link>
      </div>

      {/* Seção de Dados Pessoais */}
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
                <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Credenciais do Profissional</h1>
                <p className="text-white/80 font-body-md opacity-80">Gerencie as informações pessoais e de contato deste psicólogo.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-teko-yellow opacity-80 block">Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={personalData.name}
                    onChange={handlePersonalChange}
                    className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-teko-yellow opacity-80 block">Email de Acesso</label>
                  <input
                    type="email"
                    name="email"
                    value={personalData.email}
                    onChange={handlePersonalChange}
                    className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-teko-yellow opacity-80 block">CRP (Opcional)</label>
                  <input
                    type="text"
                    name="crp"
                    maxLength={8}
                    value={personalData.crp}
                    onChange={handlePersonalChange}
                    className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    placeholder="Ex: 00/00000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-teko-yellow opacity-80 block">Nome da Clínica (Opcional)</label>
                  <input
                    type="text"
                    name="clinicName"
                    value={personalData.clinicName}
                    onChange={handlePersonalChange}
                    className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-teko-yellow rounded-lg p-4 font-headline-md text-white outline-none transition-all"
                    placeholder="Ex: Clínica Mente Viva"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button onClick={handleSavePersonal} disabled={isSavingPersonal} className="bg-teko-yellow text-[#084D48] px-10 py-4 rounded-full font-bold hover:bg-white hover:text-[#084D48] hover:shadow-[0_4px_14px_rgba(230,168,0,0.39)] transition-all flex items-center gap-3 disabled:opacity-50">
                  {isSavingPersonal ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {isSavingPersonal ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Segurança */}
      <section className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Lock size={120} className="text-white" />
          </div>
          
          <div className="flex flex-col items-center md:items-start md:flex-row gap-8 relative z-10">
            <div className="w-32 h-32 rounded-full bg-[#FFF6E3]/5 backdrop-blur-md flex items-center justify-center border-2 border-[#7B61FF] shadow-[0_0_20px_rgba(123,97,255,0.3)] shrink-0">
              <Lock size={64} className="text-[#7B61FF] drop-shadow-[0_0_15px_rgba(123,97,255,0.8)]" />
            </div>
            
            <div className="flex-1 space-y-8 w-full">
              <div>
                <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Redefinir Senha</h1>
                <p className="text-white/80 font-body-md opacity-80">Altere a senha deste profissional caso ele tenha perdido o acesso.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="••••••••"
                      value={securityData.newPassword}
                      onChange={handleSecurityChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={securityData.confirmPassword}
                      onChange={handleSecurityChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button onClick={handleSaveSecurity} disabled={isSavingSecurity} className="bg-[#7B61FF] text-white px-10 py-4 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                  {isSavingSecurity ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {isSavingSecurity ? "Atualizando..." : "Atualizar Senha"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Exclusão de Conta */}
      <section className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <XCircle size={120} className="text-white" />
          </div>
          
          <div className="flex flex-col items-center md:items-start md:flex-row gap-8 relative z-10">
            <div className="w-32 h-32 rounded-full bg-red-500/10 backdrop-blur-md flex items-center justify-center border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] shrink-0">
              <AlertTriangle size={64} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h1 className="font-headline-lg text-3xl font-bold text-red-500 mb-2">Exclusão de Conta</h1>
                <p className="text-white/80 font-body-md opacity-80">Remover este profissional e todos os seus dados da plataforma.</p>
              </div>
              
              <div className="pt-4">
                <button onClick={() => setIsDeleteModalOpen(true)} disabled={isDeleting} className="bg-red-500 text-white px-10 py-4 rounded-full font-bold hover:bg-red-600 hover:shadow-[0_4px_14px_rgba(239,68,68,0.39)] transition-all flex items-center gap-3 disabled:opacity-50">
                  <Trash2 size={20} /> Excluir Profissional
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          
          <div className="bg-[#161308] border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] rounded-2xl w-full max-w-lg p-8 relative z-10 animate-fade-up">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/50">
                <XCircle size={40} className="text-red-500" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Ação Irreversível</h2>
                <p className="text-white/70 text-sm">
                  Você está prestes a excluir permanentemente a conta de <strong>{personalData.name}</strong>. Ao prosseguir, todos os dados de pacientes e relatórios atrelados a este profissional serão perdidos.
                </p>
                <p className="text-red-400 font-bold mt-4">
                  Tem certeza absoluta que deseja continuar?
                </p>
              </div>
              
              <div className="flex gap-4 w-full pt-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold transition-all">
                  Cancelar
                </button>
                <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all flex justify-center items-center disabled:opacity-50">
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

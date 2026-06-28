"use client";

import React, { useState } from "react";
import { UserCircle, Lock, Save, AlertTriangle, XCircle, Trash2, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { getMyDataAction, updateMyDataAction, updatePasswordAction, softDeleteAccountAction, verifyCurrentPasswordAction } from "@/actions/my-data";
import { useRouter, useParams } from "next/navigation";

export default function MyDataPage() {
  const [personalData, setPersonalData] = useState({
    name: "",
    email: "",
    crp: "",
    clinicName: "",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorToast, setErrorToast] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordWarningOpen, setIsPasswordWarningOpen] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string || "pt";

  React.useEffect(() => {
    const loadData = async () => {
      const res = await getMyDataAction();
      if (res.data) {
        setPersonalData({
          name: res.data.name || "",
          email: res.data.email || "",
          crp: res.data.crp || "",
          clinicName: res.data.clinicName || "",
        });
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    
    if (name === "crp") {
      value = value.replace(/\D/g, '');
      if (value.length > 7) value = value.slice(0, 7);
      if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    }
    
    setPersonalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(""), 4000);
  };

  const handleSavePersonal = async () => {
    if (!personalData.name || !personalData.email) {
      showError("Nome e e-mail são obrigatórios.");
      return;
    }

    setIsSavingPersonal(true);
    const res = await updateMyDataAction(personalData);
    setIsSavingPersonal(false);

    if (res.error) {
      showError(res.error);
    } else {
      showToast("Dados pessoais atualizados com sucesso!");
    }
  };

  const handleOpenPasswordWarning = async () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      showError("Preencha todos os campos de senha.");
      return;
    }
    if (securityData.newPassword === securityData.currentPassword) {
      showError("A nova senha não pode ser igual à senha atual.");
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      showError("A nova senha e a confirmação não conferem.");
      return;
    }
    if (securityData.newPassword.length < 6) {
      showError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    
    setIsSavingSecurity(true);
    const checkRes = await verifyCurrentPasswordAction(securityData.currentPassword);
    setIsSavingSecurity(false);
    
    if (checkRes.error) {
      showError(checkRes.error);
      return;
    }

    // Open warning modal
    setIsPasswordWarningOpen(true);
  };

  const handleConfirmPasswordChange = async () => {
    setIsSavingSecurity(true);
    const res = await updatePasswordAction(securityData.currentPassword, securityData.newPassword);
    
    if (res.error) {
      showError(res.error);
      setIsSavingSecurity(false);
      setIsPasswordWarningOpen(false);
    } else {
      // Success, redirect to login
      router.push(`/${lang}/login?password_changed=true`);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await softDeleteAccountAction();
    if (res.error) {
      showError(res.error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    } else {
      router.push(`/${lang}/cadastro?account_deleted=true`);
    }
  };

  return (
    <div className="w-full pb-16 animate-fade-in max-w-5xl mx-auto space-y-6 relative">
      
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 size={48} className="animate-spin text-teko-yellow" />
        </div>
      )}

      {!isLoading && (
        <>
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
                <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Meus Dados</h1>
                <p className="text-white/80 font-body-md opacity-80">Gerencie suas informações pessoais de perfil e contato.</p>
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
                <button 
                  onClick={handleSavePersonal} 
                  disabled={isSavingPersonal}
                  className="bg-teko-yellow text-[#084D48] px-10 py-4 rounded-full font-bold hover:bg-white hover:text-[#084D48] hover:shadow-[0_4px_14px_rgba(230,168,0,0.39)] transition-all flex items-center gap-3 disabled:opacity-50"
                >
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
                <h1 className="font-headline-lg text-3xl font-bold text-white mb-2">Segurança e Acesso</h1>
                <p className="text-white/80 font-body-md opacity-80">Atualize sua senha para manter sua conta segura.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Senha Atual</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      placeholder="••••••••"
                      value={securityData.currentPassword}
                      onChange={handleSecurityChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 pr-12 font-headline-md text-white outline-none transition-all placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="••••••••"
                      value={securityData.newPassword}
                      onChange={handleSecurityChange}
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 pr-12 font-headline-md text-white outline-none transition-all placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
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
                      className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 pr-12 font-headline-md text-white outline-none transition-all placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={handleOpenPasswordWarning} 
                  disabled={isSavingSecurity}
                  className="bg-[#7B61FF] text-white px-10 py-4 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  <Save size={20} /> Atualizar Senha
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
                <p className="text-white/80 font-body-md opacity-80">Encerre sua conta e exclua todos os seus dados da plataforma.</p>
              </div>
              
              <div className="pt-4">
                <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-500 text-white px-10 py-4 rounded-full font-bold hover:bg-red-600 hover:shadow-[0_4px_14px_rgba(239,68,68,0.39)] transition-all flex items-center gap-3">
                  <Trash2 size={20} /> Excluir Conta
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
                  Você está prestes a excluir permanentemente sua conta. Ao prosseguir, você perderá instantaneamente todos os seus <strong>acessos, pacientes, relatórios, jogos e benefícios psicométricos</strong> fornecidos pela plataforma Teko.
                </p>
                <p className="text-red-400 font-bold mt-4">
                  Tem certeza absoluta que deseja continuar?
                </p>
              </div>
              
              <div className="flex gap-4 w-full pt-4">
                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : "Sim, Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Troca de Senha */}
      {isPasswordWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPasswordWarningOpen(false)}></div>
          
          <div className="bg-[#161308] border border-teko-yellow/30 shadow-[0_0_40px_rgba(230,168,0,0.15)] rounded-2xl w-full max-w-lg p-8 relative z-10 animate-fade-up">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-teko-yellow/10 flex items-center justify-center border border-teko-yellow/50">
                <Lock size={40} className="text-teko-yellow" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Atenção!</h2>
                <p className="text-white/70 text-sm">
                  Você está prestes a atualizar sua senha. Para concluir essa ação com segurança, <strong>sua sessão atual será encerrada imediatamente</strong>.
                </p>
                <p className="text-teko-yellow font-bold mt-4">
                  Será necessário realizar o login novamente com sua Nova Senha para voltar ao painel. Confirma a alteração?
                </p>
              </div>
              
              <div className="flex gap-4 w-full pt-4">
                <button onClick={() => setIsPasswordWarningOpen(false)} disabled={isSavingSecurity} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleConfirmPasswordChange} disabled={isSavingSecurity} className="flex-1 bg-teko-yellow hover:bg-white text-[#084D48] px-6 py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(230,168,0,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {isSavingSecurity ? <Loader2 size={20} className="animate-spin" /> : "Confirmar e Sair"}
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
              <h3 className="font-bold font-headline-md text-white text-base mb-1">
                Sucesso!
              </h3>
              <p className="text-white/80 font-body-md text-sm">
                {successToast}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 rounded-b-xl transition-all ease-linear bg-[#7B61FF]"
              style={{ width: '0%', transitionDuration: '4000ms' }}
              ref={(el) => {
                if (el) setTimeout(() => { el.style.width = '100%' }, 50);
              }}
            />
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
              <h3 className="font-bold font-headline-md text-red-400 text-base mb-1">
                Atenção
              </h3>
              <p className="text-white/80 font-body-md text-sm">
                {errorToast}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 rounded-b-xl transition-all ease-linear bg-red-500"
              style={{ width: '0%', transitionDuration: '4000ms' }}
              ref={(el) => {
                if (el) setTimeout(() => { el.style.width = '100%' }, 50);
              }}
            />
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
}

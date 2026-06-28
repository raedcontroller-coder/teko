"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserCircle, Lock, Save, AlertTriangle, XCircle, Trash2, ArrowLeft } from "lucide-react";

export default function AdminProfissionalDadosPage() {
  const params = useParams();
  const lang = params?.lang as string || "pt";

  // Mock initial state for Psychologist
  const [personalData, setPersonalData] = useState({
    name: "Dra. Maria Victoria",
    email: "maria.victoria@teko.com.br",
    crp: "06/12345",
    clinicName: "Clínica Crescer",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePersonal = () => {
    alert("Dados pessoais do profissional atualizados com sucesso!");
  };

  const handleSaveSecurity = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert("A nova senha e a confirmação não conferem.");
      return;
    }
    alert("Senha do profissional atualizada com sucesso!");
    setSecurityData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleDeleteAccount = () => {
    alert("Conta do profissional foi excluída permanentemente. (Mock)");
    setIsDeleteModalOpen(false);
  };

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
                <button onClick={handleSavePersonal} className="bg-teko-yellow text-[#084D48] px-10 py-4 rounded-full font-bold hover:bg-white hover:text-[#084D48] hover:shadow-[0_4px_14px_rgba(230,168,0,0.39)] transition-all flex items-center gap-3">
                  <Save size={20} /> Salvar Alterações
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
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="••••••••"
                    value={securityData.newPassword}
                    onChange={handleSecurityChange}
                    className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#7B61FF] opacity-80 block">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={securityData.confirmPassword}
                    onChange={handleSecurityChange}
                    className="w-full bg-[#FFF6E3]/5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border-none focus:ring-2 focus:ring-[#7B61FF] rounded-lg p-4 font-headline-md text-white outline-none transition-all placeholder:text-white/20"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button onClick={handleSaveSecurity} className="bg-[#7B61FF] text-white px-10 py-4 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
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
                <p className="text-white/80 font-body-md opacity-80">Remover este profissional e todos os seus dados da plataforma.</p>
              </div>
              
              <div className="pt-4">
                <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-500 text-white px-10 py-4 rounded-full font-bold hover:bg-red-600 hover:shadow-[0_4px_14px_rgba(239,68,68,0.39)] transition-all flex items-center gap-3">
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
                <button onClick={handleDeleteAccount} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

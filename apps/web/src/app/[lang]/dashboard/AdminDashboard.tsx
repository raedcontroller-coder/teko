import React from "react";
import Link from "next/link";
import { Plus, Users, FileText, Baby } from "lucide-react";
import { listPsicologosAction, getAdminDashboardStatsAction } from "../../../actions/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/Table";

export default async function AdminDashboard() {
  const dbPsicologos = await listPsicologosAction();
  const stats = await getAdminDashboardStatsAction();
  
  const psicologos = [...dbPsicologos];

  return (
    <div className="space-y-8 animate-fade-in w-full pb-16">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">Administração</h1>
          <p className="text-white/70 font-body-md mt-1">Gerencie os profissionais cadastrados na plataforma Teko.</p>
        </div>
        <Link href="/pt/dashboard/admin/novo-psicologo">
          <button className="bg-teko-yellow text-[#084D48] px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_14px_rgba(123,97,255,0.4)] transition-all">
            <Plus size={20} />
            Novo Profissional
          </button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 text-teko-yellow rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">{stats.profissionais}</h3>
            <p className="text-white/70 font-label-md">Profissionais ativos</p>
          </div>
        </div>

        <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 text-[#7B61FF] rounded-lg">
              <FileText size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">{stats.relatorios}</h3>
            <p className="text-white/70 font-label-md">Relatórios gerados</p>
          </div>
        </div>

        <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 hover:border-white/25 hover:bg-[#FFF6E3]/10 transition-all duration-300 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#D8E6CC]/20 text-[#D8E6CC] rounded-lg">
              <Baby size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">{stats.criancas}</h3>
            <p className="text-white/70 font-label-md">Crianças na plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabela de Psicólogos */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-[20px] font-bold text-white">Profissionais Cadastrados</h2>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CRP</TableHead>
              <TableHead>Clínica</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {psicologos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-white/50 italic py-8">
                  Nenhum profissional cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              psicologos.map((psi) => (
                <TableRow key={psi.id}>
                  <TableCell className="font-bold">{psi.name}</TableCell>
                  <TableCell>{psi.email}</TableCell>
                  <TableCell>{psi.crp || "-"}</TableCell>
                  <TableCell>{psi.clinicName || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-center mt-6">
          <Link href="/pt/dashboard/admin/profissionais">
            <button className="bg-teko-yellow text-[#084D48] px-8 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(230,168,0,0.3)] hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all">
              Ver todos os profissionais
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

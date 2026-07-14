"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, Plus, UserCircle, Users, X } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../../components/ui/Table";

type Psicologo = {
  id: string;
  name: string;
  email: string;
  crp: string | null;
  clinicName: string | null;
  createdAt: Date;
  childrenCount?: number;
  sessionsCount?: number;
  reportsCount?: number;
};

import { Button } from "../../../../../components/ui/Button";

export default function ProfissionaisClient({ initialData }: { initialData: Psicologo[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPsi, setSelectedPsi] = useState<Psicologo | null>(null);
  const params = useParams();
  const lang = (params?.lang as string) || "pt";

  const filtered = initialData.filter((psi) =>
    psi.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    psi.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in w-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">Meus Profissionais</h1>
          <p className="text-white/70 font-body-md mt-1">Gerencie a lista completa de psicólogos da plataforma Teko.</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            <input
              type="text"
              placeholder="Buscar profissional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-[#FFF6E3]/5 backdrop-blur-md border border-white/15 rounded-full text-[14px] font-body-md outline-none focus:border-teko-yellow text-white placeholder:text-white/40 transition-all w-full md:w-72 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
            />
          </div>
          <Link href={`/${lang}/dashboard/admin/novo-psicologo`} className="w-full md:w-auto">
            <button className="w-full bg-teko-yellow text-[#084D48] px-4 py-2 text-sm rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_14px_rgba(123,97,255,0.4)] transition-all">
              <Plus size={18} />
              Novo Profissional
            </button>
          </Link>
        </div>
      </div>

      {/* Tabela de Profissionais */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CRP</TableHead>
              <TableHead>Clínica</TableHead>
              <TableHead>Crianças</TableHead>
              <TableHead>Sessões</TableHead>
              <TableHead>Relatórios</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-white/50 italic py-8">
                  Nenhum profissional encontrado para &quot;{searchTerm}&quot;.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((psi) => (
                <TableRow key={psi.id}>
                  <TableCell className="font-bold">{psi.name}</TableCell>
                  <TableCell>{psi.email}</TableCell>
                  <TableCell>{psi.crp || "-"}</TableCell>
                  <TableCell>{psi.clinicName || "-"}</TableCell>
                  <TableCell>{psi.childrenCount || 0}</TableCell>
                  <TableCell>{psi.sessionsCount || 0}</TableCell>
                  <TableCell>{psi.reportsCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedPsi(psi)}>
                      Acessar Perfil
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Acesso ao Perfil */}
      {selectedPsi && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPsi(null)}></div>
          
          <div className="bg-[#161308] border border-teko-yellow/30 shadow-[0_0_40px_rgba(230,168,0,0.15)] rounded-3xl w-full max-w-2xl p-8 relative z-10 animate-fade-up">
            <button 
              onClick={() => setSelectedPsi(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Acessar Perfil</h2>
              <p className="text-white/70 text-sm">
                O que você deseja gerenciar para <strong>{selectedPsi.name}</strong>?
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Credenciais */}
              <Link href={`/${lang}/dashboard/admin/profissionais/${selectedPsi.id}/dados`} className="group block">
                <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/10 hover:border-teko-yellow/50 rounded-2xl p-6 h-full flex flex-col items-center text-center transition-all duration-300 hover:bg-[#FFF6E3]/10 hover:shadow-[0_0_20px_rgba(230,168,0,0.15)]">
                  <div className="w-16 h-16 rounded-full bg-teko-yellow/10 flex items-center justify-center border border-teko-yellow/30 mb-4 group-hover:scale-110 transition-transform">
                    <UserCircle size={32} className="text-teko-yellow drop-shadow-[0_0_10px_rgba(230,168,0,0.5)]" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-teko-yellow transition-colors">Credenciais do Profissional</h3>
                  <p className="text-white/60 text-sm font-body-md">Visualize e edite nome, e-mail, CRP e gerencie senhas.</p>
                </div>
              </Link>

              {/* Card Pacientes */}
              <Link href={`/${lang}/dashboard/admin/profissionais/${selectedPsi.id}/pacientes`} className="group block">
                <div className="bg-[#FFF6E3]/5 backdrop-blur-md border border-white/10 hover:border-[#7B61FF]/50 rounded-2xl p-6 h-full flex flex-col items-center text-center transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(123,97,255,0.15)]">
                  <div className="w-16 h-16 rounded-full bg-[#7B61FF]/10 flex items-center justify-center border border-[#7B61FF]/30 mb-4 group-hover:scale-110 transition-transform">
                    <Users size={32} className="text-[#7B61FF] drop-shadow-[0_0_10px_rgba(123,97,255,0.5)]" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-[#7B61FF] transition-colors">Pacientes do Profissional</h3>
                  <p className="text-white/60 text-sm font-body-md">Acesse a lista completa de crianças sob responsabilidade clínica.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../../../../components/ui/Table";
import { Button } from "../../../../../../../components/ui/Button";
import { Search, ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminProfissionalPacientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const params = useParams();
  const lang = (params?.lang as string) || "pt";

  const mockPatients = [
    { id: 1, name: "Lucas M.", age: 7, lastSession: "Hoje, 14:30" },
    { id: 2, name: "Mariana S.", age: 6, lastSession: "Ontem" },
    { id: 3, name: "Pedro A.", age: 8, lastSession: "Há 2 dias" },
    { id: 4, name: "João V.", age: 9, lastSession: "Na semana passada" },
  ];

  const filteredPatients = mockPatients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-2">
        <Link href={`/${lang}/dashboard/admin/profissionais`}>
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <ArrowLeft size={18} />
            <span className="font-bold text-sm">Voltar para Profissionais</span>
          </button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">Pacientes do Profissional</h1>
          <p className="text-white/70 font-body-md mt-1">Visualize todos os pacientes atribuídos a este psicólogo.</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-full text-[14px] font-body-md outline-none focus:border-[#7B61FF] text-white placeholder:text-white/40 transition-all w-full md:w-72"
            />
          </div>
          <Link href={`/${lang}/dashboard/admin/profissionais/${params.id}/pacientes/novo`} className="w-full md:w-auto">
            <Button variant="primary" className="gap-2 w-full whitespace-nowrap">
              <UserPlus size={18} />
              Novo Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="mt-8 animate-fade-up">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Paciente</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead>Última Sessão</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-bold">{patient.name}</TableCell>
                  <TableCell>{patient.age} anos</TableCell>
                  <TableCell>{patient.lastSession}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/${lang}/dashboard/admin/profissionais/${params.id}/pacientes/${patient.id}`}>
                      <Button variant="secondary" size="sm">Acessar Perfil</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-white/50">
                  Nenhum paciente encontrado para "{searchTerm}".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

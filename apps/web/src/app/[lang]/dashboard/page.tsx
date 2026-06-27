"use client";

import React from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/Table";
import { UserPlus, Activity, FileText, CheckCircle2 } from "lucide-react";

export default function DashboardHome() {
  const recentPatients = [
    { id: 1, name: "Lucas M.", age: 7, lastSession: "Hoje, 14:30", status: "Sessão Concluída", statusVariant: "success" as const },
    { id: 2, name: "Mariana S.", age: 6, lastSession: "Ontem", status: "Relatório Pronto", statusVariant: "primary" as const },
    { id: 3, name: "Pedro A.", age: 8, lastSession: "Há 2 dias", status: "Aguardando", statusVariant: "neutral" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">Resumo Clínico</h1>
          <p className="text-white/70 font-body-md mt-1">Acompanhe o progresso dos seus pacientes em tempo real.</p>
        </div>
        <div className="flex gap-4">

          <Button variant="primary" className="gap-2">
            <UserPlus size={18} />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card interactive className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 text-teko-yellow rounded-lg">
              <UsersIcon size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">24</h3>
            <p className="text-white/70 font-label-md">Pacientes Ativos</p>
          </div>
        </Card>

        <Card interactive className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 text-[#7B61FF] rounded-lg">
              <FileText size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">12</h3>
            <p className="text-white/70 font-label-md">Relatórios Prontos</p>
          </div>
        </Card>

        <Card interactive className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#D8E6CC] text-[#2E5C14] rounded-lg">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">8</h3>
            <p className="text-white/70 font-label-md">Sessões Concluídas</p>
          </div>
        </Card>
      </div>

      {/* Recent Patients Table */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-[20px] font-bold text-white">Pacientes Recentes</h2>
          <Button variant="secondary" size="sm">Ver todos</Button>
        </div>
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
            {recentPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-bold">{patient.name}</TableCell>
                <TableCell>{patient.age} anos</TableCell>
                <TableCell>{patient.lastSession}</TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm">Acessar Perfil</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Inline icon component since Users is already used but maybe we need a simple icon here without conflicting imports
function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

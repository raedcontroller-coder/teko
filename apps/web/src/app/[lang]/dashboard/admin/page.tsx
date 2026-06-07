import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listPsicologosAction } from "../../../../actions/admin";
import { Button } from "../../../../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../components/ui/Table";

export default async function AdminPage() {
  const psicologos = await listPsicologosAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-on-surface">Administração</h1>
          <p className="text-on-surface-variant mt-1">Gerencie os psicólogos cadastrados na plataforma Teko.</p>
        </div>
        <Link href="/dashboard/admin/novo-psicologo">
          <Button className="gap-2">
            <Plus size={20} />
            Cadastrar Psicólogo
          </Button>
        </Link>
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>CRP</TableHead>
              <TableHead>Clínica</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {psicologos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-on-surface-variant">
                  Nenhum psicólogo cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              psicologos.map((psi) => (
                <TableRow key={psi.id}>
                  <TableCell className="font-medium text-primary">{psi.name}</TableCell>
                  <TableCell>{psi.email}</TableCell>
                  <TableCell>{psi.cpf}</TableCell>
                  <TableCell>{psi.crp || "-"}</TableCell>
                  <TableCell>{psi.clinicName || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

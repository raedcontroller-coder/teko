"use client";

import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../../components/ui/Table";
import { Button } from "../../../../components/ui/Button";
import { Search, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { getPatientsAction } from "@/actions/patients";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function MeusPacientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "pt";
  const [showDeletedToast, setShowDeletedToast] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      const res = await getPatientsAction();
      if (res.data) {
        setPatients(res.data);
      }
      setIsLoading(false);
    };
    fetchPatients();
  }, []); // Remove dependencies so it only fetches on mount

  useEffect(() => {
    if (searchParams?.get("deleted") === "true") {
      setShowDeletedToast(true);
      // Limpa a URL depois de um tempo para não ficar com o query string ali
      setTimeout(() => {
        setShowDeletedToast(false);
        router.replace(`/${lang}/dashboard/pacientes`);
      }, 3000);
    }
  }, [searchParams, lang, router]);

  const filteredPatients = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">Meus Pacientes</h1>
          <p className="text-white/70 font-body-md mt-1">Pesquise e acesse os relatórios e perfis de todos os seus pacientes.</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-full text-[14px] font-body-md outline-none focus:border-teko-yellow text-white placeholder:text-white/40 transition-all w-full md:w-72"
            />
          </div>
          <Link href={`/${lang}/dashboard/pacientes/novo`} className="w-full md:w-auto">
            <Button variant="primary" className="gap-2 w-full whitespace-nowrap">
              <UserPlus size={18} />
              Novo Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="mt-8">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-teko-yellow" />
                </TableCell>
              </TableRow>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-bold">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>
                    {patient.lastSessionDate ? (
                      <span className="text-white/80">
                        {new Date(patient.lastSessionDate).toLocaleDateString("pt-BR")}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-white/5 rounded-md text-[11px] font-bold tracking-wider text-white/40 uppercase">
                        Nenhuma
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/${lang}/dashboard/pacientes/${patient.id}`}>
                      <Button variant="secondary" size="sm">Acessar Perfil</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-white/50">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showDeletedToast && (
        <div className="fixed top-8 right-8 z-[200] animate-fade-left">
          <div className="bg-[#FFF6E3]/10 border border-white/20 backdrop-blur-xl rounded-xl p-6 pr-10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-5 min-w-[360px]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-500/20">
              <CheckCircle2 size={28} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold font-headline-md text-white text-base mb-1">
                Excluído!
              </h3>
              <p className="text-white/80 font-body-md text-sm">
                Paciente excluído com sucesso.
              </p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 rounded-b-xl transition-all ease-linear bg-red-500"
              style={{ width: '0%', transitionDuration: '3000ms' }}
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

"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/Table";
import { UserPlus, FileText, Gamepad2, Loader2 } from "lucide-react";
import { getDashboardMetricsAction } from "@/actions/patients";

type PatientData = {
  id: string;
  name: string;
  age: string | number | null;
  lastSessionDate?: Date | string | null;
  [key: string]: unknown;
};

const psychDashboardTranslations: Record<string, {
  title: string;
  subtitle: string;
  newPatient: string;
  activePatients: string;
  readyReports: string;
  completedSessions: string;
  recentPatients: string;
  patientName: string;
  age: string;
  lastSession: string;
  none: string;
  noPatients: string;
  viewAllPatients: string;
  comingSoon: string;
}> = {
  pt: {
    title: "Resumo Clínico",
    subtitle: "Acompanhe o progresso dos seus pacientes em tempo real.",
    newPatient: "Novo Paciente",
    activePatients: "Pacientes Ativos",
    readyReports: "Relatórios Prontos",
    completedSessions: "Sessões Concluídas",
    recentPatients: "Pacientes Recentes",
    patientName: "Nome do Paciente",
    age: "Idade",
    lastSession: "Última Sessão",
    none: "Nenhuma",
    noPatients: "Nenhum paciente cadastrado ainda.",
    viewAllPatients: "Ver todos os pacientes",
    comingSoon: "Em breve..."
  },
  en: {
    title: "Clinical Summary",
    subtitle: "Track your patients' progress in real time.",
    newPatient: "New Patient",
    activePatients: "Active Patients",
    readyReports: "Completed Reports",
    completedSessions: "Completed Sessions",
    recentPatients: "Recent Patients",
    patientName: "Patient Name",
    age: "Age",
    lastSession: "Last Session",
    none: "None",
    noPatients: "No patients registered yet.",
    viewAllPatients: "View all patients",
    comingSoon: "Coming soon..."
  }
};

export default function PsychologistDashboard() {
  const params = useParams();
  const lang = (params?.lang as string) === "en" ? "en" : "pt";
  const t = psychDashboardTranslations[lang];

  const [patients, setPatients] = React.useState<PatientData[]>([]);
  const [totalSessions, setTotalSessions] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      const res = await getDashboardMetricsAction();
      if (res.data) {
        setPatients(res.data.patients);
        setTotalSessions(res.data.totalSessions);
      }
      setIsLoading(false);
    };
    fetchMetrics();
  }, []);

  const recentPatients = patients.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">{t.title}</h1>
          <p className="text-white/70 font-body-md mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-4">
          <Link href={`/${lang}/dashboard/pacientes/novo`}>
            <Button variant="primary" className="gap-2">
              <UserPlus size={18} />
              {t.newPatient}
            </Button>
          </Link>
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
            <h3 className="font-headline-md text-[32px] font-bold text-white">
              {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-white/50" /> : patients.length}
            </h3>
            <p className="text-white/70 font-label-md">{t.activePatients}</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 opacity-50 select-none relative overflow-hidden" style={{ cursor: 'not-allowed' }}>
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 text-white/40 rounded-lg">
              <FileText size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white/50">0</h3>
            <p className="text-white/50 font-label-md">{t.readyReports}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-white/5 rounded-md text-[11px] font-bold tracking-wider text-white/40 uppercase">
              {t.comingSoon}
            </span>
          </div>
        </Card>

        <Card interactive className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teko-yellow/20 text-teko-yellow rounded-lg">
              <Gamepad2 size={24} />
            </div>
          </div>
          <div>
            <h3 className="font-headline-md text-[32px] font-bold text-white">
              {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-white/50" /> : totalSessions}
            </h3>
            <p className="text-white/70 font-label-md">{t.completedSessions}</p>
          </div>
        </Card>
      </div>

      {/* Recent Patients Table */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-[20px] font-bold text-white">{t.recentPatients}</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.patientName}</TableHead>
              <TableHead>{t.age}</TableHead>
              <TableHead>{t.lastSession}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-teko-yellow" />
                </TableCell>
              </TableRow>
            ) : recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-bold">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>
                    {patient.lastSessionDate ? (
                      <span className="text-white/80">
                        {new Date(patient.lastSessionDate).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR")}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-white/5 rounded-md text-[11px] font-bold tracking-wider text-white/40 uppercase">
                        {t.none}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-white/50">
                  {t.noPatients}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-center mt-6">
          <Link href={`/${lang}/dashboard/pacientes`}>
            <Button variant="primary" className="px-8 py-3 text-sm font-bold shadow-[0_0_20px_rgba(230,168,0,0.3)] hover:shadow-[0_0_20px_rgba(123,97,255,0.4)]">
              {t.viewAllPatients}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function UsersIcon({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


import React from "react";
import Link from "next/link";
import { Plus, Users, FileText, Baby, UserCheck, ArrowRight } from "lucide-react";
import { listPsicologosAction, getAdminDashboardStatsAction } from "../../../actions/admin";
import { Card } from "../../../components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/Table";

const adminDashboardTranslations: Record<string, {
  title: string;
  subtitle: string;
  newProf: string;
  activeProfs: string;
  generatedReports: string;
  childrenOnPlatform: string;
  registeredProfs: string;
  recentProfsSub: string;
  name: string;
  email: string;
  crp: string;
  clinic: string;
  noProfs: string;
  viewAll: string;
  comingSoon: string;
}> = {
  pt: {
    title: "Administração",
    subtitle: "Gerencie os profissionais cadastrados na plataforma Teko.",
    newProf: "Novo Profissional",
    activeProfs: "Profissionais ativos",
    generatedReports: "Relatórios gerados",
    childrenOnPlatform: "Crianças na plataforma",
    registeredProfs: "Profissionais Cadastrados",
    recentProfsSub: "Profissionais e responsáveis clínicos mais recentes",
    name: "Nome",
    email: "E-mail",
    crp: "CRP",
    clinic: "Clínica",
    noProfs: "Nenhum profissional cadastrado ainda.",
    viewAll: "Ver todos",
    comingSoon: "Em breve..."
  },
  en: {
    title: "Administration",
    subtitle: "Manage registered professionals on the Teko platform.",
    newProf: "New Professional",
    activeProfs: "Active professionals",
    generatedReports: "Generated reports",
    childrenOnPlatform: "Children on platform",
    registeredProfs: "Registered Professionals",
    recentProfsSub: "Most recently added clinic managers & practitioners",
    name: "Name",
    email: "Email",
    crp: "License (CRP)",
    clinic: "Clinic",
    noProfs: "No professionals registered yet.",
    viewAll: "View all",
    comingSoon: "Coming soon..."
  }
};

export default async function AdminDashboard({ lang = "pt" }: { lang?: string }) {
  const currentLang = lang === "en" ? "en" : "pt";
  const t = adminDashboardTranslations[currentLang];

  const dbPsicologos = await listPsicologosAction();
  const stats = await getAdminDashboardStatsAction();
  
  // Compact preview: show only the 4 most recent professionals in the dashboard view
  const psicologosPreview = dbPsicologos.slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in w-full pb-16">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] text-white font-bold">{t.title}</h1>
          <p className="text-white/70 font-body-md mt-1">{t.subtitle}</p>
        </div>
        <Link href={`/${currentLang}/dashboard/admin/novo-psicologo`}>
          <button className="bg-teko-yellow text-[#084D48] px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_14px_rgba(123,97,255,0.4)] transition-all">
            <Plus size={20} />
            {t.newProf}
          </button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="flex flex-col gap-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card interactive className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/10 text-teko-yellow rounded-lg">
                <Users size={24} />
              </div>
            </div>
            <div>
              <h3 className="font-headline-md text-[32px] font-bold text-white">{stats.profissionais}</h3>
              <p className="text-white/70 font-label-md">{t.activeProfs}</p>
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
              <p className="text-white/50 font-label-md">{t.generatedReports}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-white/5 rounded-md text-[11px] font-bold tracking-wider text-white/40 uppercase">
                {t.comingSoon}
              </span>
            </div>
          </Card>
        </div>

        {/* Card ocupando toda a margem horizontal abaixo */}
        <Card interactive className="flex flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-teko-yellow/20 text-teko-yellow rounded-xl border border-teko-yellow/30">
              <Baby size={28} />
            </div>
            <div>
              <h3 className="font-headline-md text-[32px] font-bold text-white leading-none">{stats.criancas}</h3>
              <p className="text-white/70 font-label-md mt-1">{t.childrenOnPlatform}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela Compacta & Dinâmica de Profissionais */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {/* Dynamic Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teko-yellow/10 text-teko-yellow rounded-xl border border-teko-yellow/20 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline-md text-[20px] font-bold text-white">{t.registeredProfs}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teko-yellow/20 text-teko-yellow text-xs font-bold border border-teko-yellow/30 font-mono">
                  {dbPsicologos.length}
                </span>
                <Link href={`/${currentLang}/dashboard/admin/profissionais`}>
                  <span className="text-teko-yellow hover:text-[#7B61FF] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg border border-white/10 ml-1">
                    {t.viewAll} <ArrowRight size={13} />
                  </span>
                </Link>
              </div>
              <p className="text-white/60 text-xs font-body-md mt-0.5">{t.recentProfsSub}</p>
            </div>
          </div>
        </div>
        
        {/* Glassmorphic Table Card */}
        <Card className="p-0 overflow-hidden border border-white/15">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 bg-black/20">
                <TableHead className="py-3 px-5 text-white/70 text-xs">{t.name}</TableHead>
                <TableHead className="py-3 px-5 text-white/70 text-xs">{t.email}</TableHead>
                <TableHead className="py-3 px-5 text-white/70 text-xs">{t.crp}</TableHead>
                <TableHead className="py-3 px-5 text-white/70 text-xs">{t.clinic}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {psicologosPreview.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-white/50 italic py-8">
                    {t.noProfs}
                  </TableCell>
                </TableRow>
              ) : (
                psicologosPreview.map((psi) => {
                  const initial = psi.name ? psi.name.charAt(0).toUpperCase() : "P";
                  return (
                    <TableRow key={psi.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teko-yellow/20 text-teko-yellow font-bold text-xs flex items-center justify-center border border-teko-yellow/30">
                            {initial}
                          </div>
                          <span className="font-bold text-white text-sm">{psi.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-5 text-white/80 text-sm">{psi.email}</TableCell>
                      <TableCell className="py-3 px-5">
                        {psi.crp ? (
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/90 text-xs font-mono">
                            {psi.crp}
                          </span>
                        ) : (
                          <span className="text-white/40 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-5 text-white/80 text-sm">{psi.clinicName || "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

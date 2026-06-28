"use client";

import React, { useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { exportAdminDadosGeradosCsvAction } from "@/actions/admin";

interface DadosRow {
  id: string;
  psicologoName: string;
  psicologoEmail: string;
  psicologoCrp: string;
  psicologoClinic: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  alunoName: string;
  alunoAge: string;
  alunoGender: string;
  vtri: string;
  qa: string;
  imp: string;
}

export default function DadosGeradosClient({ rawData }: { rawData: DadosRow[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredData = rawData.filter((row) => {
    const searchString = `${row.psicologoName} ${row.alunoName} ${row.guardianName} ${row.psicologoClinic}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAdminDadosGeradosCsvAction();
      if (result.error || !result.csv) {
        alert("Erro ao exportar CSV: " + result.error);
        setIsExporting(false);
        return;
      }
      
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dados_gerados_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full pb-16 animate-fade-in max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#FFF6E3]/5 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teko-yellow/5 rounded-full blur-[80px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold text-white mb-3">Dados Gerados</h1>
          <p className="text-white/80 font-body-md text-base sm:text-lg">
            Acompanhe o registro bruto de todas as crianças ativas na plataforma Teko, extraindo informações sobre psicólogos responsáveis, dados de família e métricas avançadas (VTRI, QA, IMP).
          </p>
        </div>
      </div>

      {/* Control Bar (Busca e Exportação) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
          <input
            type="text"
            placeholder="Buscar por criança, psicólogo, responsável ou clínica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FFF6E3]/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teko-yellow transition-all"
          />
        </div>
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full sm:w-auto bg-teko-yellow text-[#084D48] px-6 py-3 rounded-xl font-bold hover:bg-[#7B61FF] hover:text-white hover:shadow-[0_4px_14px_rgba(123,97,255,0.39)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting ? "Gerando Arquivo..." : "Exportar como CSV"}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-[#161308]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-6 text-sm font-bold text-white/90 whitespace-nowrap">Psicólogo</th>
                <th className="py-4 px-6 text-sm font-bold text-white/90 whitespace-nowrap">Contato Psi</th>
                <th className="py-4 px-6 text-sm font-bold text-white/90 whitespace-nowrap">Responsável</th>
                <th className="py-4 px-6 text-sm font-bold text-white/90 whitespace-nowrap">Criança</th>
                <th className="py-4 px-6 text-sm font-bold text-teko-yellow whitespace-nowrap text-center">VTRI</th>
                <th className="py-4 px-6 text-sm font-bold text-teko-yellow whitespace-nowrap text-center">QA</th>
                <th className="py-4 px-6 text-sm font-bold text-teko-yellow whitespace-nowrap text-center">IMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/50">
                    Nenhum dado encontrado.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-bold text-white">{row.psicologoName}</p>
                      <p className="text-xs text-white/50">{row.psicologoClinic}</p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="text-sm text-white/80">{row.psicologoEmail}</p>
                      <p className="text-xs text-white/50">{row.psicologoCrp}</p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-bold text-white text-sm">{row.guardianName}</p>
                      <p className="text-xs text-white/50">{row.guardianPhone}</p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <p className="font-bold text-[#7B61FF] text-sm">{row.alunoName}</p>
                      <p className="text-xs text-white/50">{row.alunoAge} anos • {row.alunoGender}</p>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/80">
                        {row.vtri}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/80">
                        {row.qa}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/80">
                        {row.imp}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Search, Bell } from "lucide-react";
import { getSession } from "../../actions/auth";

export async function Topbar() {
  const session = await getSession();
  const name = session?.name || "Psicólogo(a)";
  const initials = name.charAt(0).toUpperCase();

  return (
    <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-xl bg-black/20">
      <div>
        <h2 className="font-headline-md text-white font-bold">Painel do Psicólogo</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
          <input
            type="text"
            placeholder="Buscar paciente ou relatório..."
            className="pl-12 pr-4 py-2 bg-black/20 border border-white/10 rounded-full text-[14px] font-body-md outline-none focus:border-teko-yellow text-white placeholder:text-white/40 transition-all w-64"
          />
        </div>



        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-10 h-10 rounded-xl bg-teko-yellow text-on-secondary-fixed flex items-center justify-center font-bold font-label-md shadow-[0_0_15px_rgba(230,168,0,0.3)]">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-[14px] font-bold text-white">{name}</p>
            <p className="text-[12px] font-body-md text-[#7B61FF] font-bold">Licença Ativa</p>
          </div>
        </div>
      </div>
    </header>
  );
}

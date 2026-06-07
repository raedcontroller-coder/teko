import React from "react";
import { Search, Bell } from "lucide-react";
import { getSession } from "../../actions/auth";

export async function Topbar() {
  const session = await getSession();
  const name = session?.name || "Psicólogo(a)";
  const initials = name.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-outline-variant flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h2 className="font-headline-md text-primary font-bold">Painel do Psicólogo</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" size={18} />
          <input
            type="text"
            placeholder="Buscar aluno ou relatório..."
            className="pl-10 pr-4 py-2 bg-surface-container rounded-full text-[14px] font-body-md outline-none focus:ring-2 focus:ring-primary-fixed-dim transition-all w-64"
          />
        </div>

        <button className="relative p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-label-md">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-[14px] font-bold text-on-surface">{name}</p>
            <p className="text-[12px] font-body-md text-on-surface-variant">Licença Ativa</p>
          </div>
        </div>
      </div>
    </header>
  );
}

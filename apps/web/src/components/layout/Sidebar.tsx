"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, UserCircle, LogOut, Shield } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { logoutAction } from "../../actions/auth";

export function Sidebar({ role }: { role?: string }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) || "pt";

  const links = role === "GLOBAL_ADMIN" 
    ? [
        { name: "Painel Inicial", href: `/${lang}/dashboard`, icon: <LayoutDashboard size={20} /> },
        { name: "Meus profissionais", href: `/${lang}/dashboard/admin/profissionais`, icon: <Shield size={20} /> },
        { name: "Meus Pacientes", href: `/${lang}/dashboard/pacientes`, icon: <Users size={20} /> },
        { name: "Meus Dados", href: `/${lang}/dashboard/my-data`, icon: <UserCircle size={20} /> },
      ]
    : [
        { name: "Painel Inicial", href: `/${lang}/dashboard`, icon: <LayoutDashboard size={20} /> },
        { name: "Meus Pacientes", href: `/${lang}/dashboard/pacientes`, icon: <Users size={20} /> },
        { name: "Meus Dados", href: `/${lang}/dashboard/my-data`, icon: <UserCircle size={20} /> },
      ];

  return (
    <>
      <aside className="w-64 glass-panel border-r border-white/10 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex justify-center w-full mt-4">
        <Link href="/" className="hover:scale-105 transition-transform duration-500">
          <Image alt="Teko Logo" width={96} height={96} className="w-16 h-16 object-cover rounded-xl border-[2px] border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.3)]" src="/images/teko_icone.jpeg" />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          let isActive = false;
          if (link.href === `/${lang}/dashboard`) {
            isActive = pathname === link.href;
          } else if (link.name === "Meus profissionais") {
            isActive = pathname.startsWith(link.href) || pathname.includes("/admin/novo-psicologo");
          } else {
            isActive = pathname.startsWith(link.href);
          }
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-md transition-all duration-300 ${
                isActive
                  ? "bg-white/10 text-teko-yellow border-r-4 border-teko-yellow shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
                  : "text-white/80 hover:bg-white/5 hover:text-[#7B61FF]"
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-label-md transition-all duration-300">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>

    {isLogoutModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}></div>
        
        <div className="bg-[#161308] border border-teko-yellow/30 shadow-[0_0_40px_rgba(230,168,0,0.15)] rounded-2xl w-full max-w-sm p-8 relative z-10 animate-fade-up">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-teko-yellow/10 flex items-center justify-center border border-teko-yellow/50">
              <LogOut size={32} className="text-teko-yellow" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Sair da Conta</h2>
              <p className="text-white/70 text-sm">
                Tem certeza que deseja sair da sua conta na plataforma Teko?
              </p>
            </div>
            
            <div className="flex gap-4 w-full pt-4">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold transition-all">
                Cancelar
              </button>
              <button onClick={() => logoutAction()} className="flex-1 bg-teko-yellow hover:bg-white text-[#084D48] px-4 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(230,168,0,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all">
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

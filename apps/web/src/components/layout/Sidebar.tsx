"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, UserCircle, LogOut, Shield } from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { logoutAction } from "../../actions/auth";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) || "pt";

  const links = [
    { name: "Painel Inicial", href: `/${lang}/dashboard`, icon: <LayoutDashboard size={20} /> },
    ...(role === "GLOBAL_ADMIN" ? [{ name: "Administração", href: `/${lang}/dashboard/admin`, icon: <Shield size={20} /> }] : []),
    { name: "Meus Pacientes", href: `/${lang}/dashboard/pacientes`, icon: <Users size={20} /> },
    { name: "Meus Dados", href: `/${lang}/dashboard/my-data`, icon: <UserCircle size={20} /> },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-white/10 h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex justify-center w-full mt-4">
        <Link href="/" className="hover:scale-105 transition-transform duration-500">
          <Image alt="Teko Logo" width={96} height={96} className="w-16 h-16 object-cover rounded-xl border-[2px] border-white/10 shadow-[0_5px_15px_rgba(0,0,0,0.3)]" src="/images/teko_icone.jpeg" />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = link.href === `/${lang}/dashboard` 
            ? pathname === link.href 
            : pathname.startsWith(link.href);
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
        <button onClick={() => logoutAction()} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-label-md transition-all duration-300">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

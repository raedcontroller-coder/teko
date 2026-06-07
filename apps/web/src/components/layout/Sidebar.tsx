"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, Gamepad2, Settings, LogOut, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "../../actions/auth";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  const links = [
    { name: "Painel Inicial", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    ...(role === "GLOBAL_ADMIN" ? [{ name: "Administração", href: "/dashboard/admin", icon: <Shield size={20} /> }] : []),
    { name: "Meus Alunos", href: "/dashboard/alunos", icon: <Users size={20} /> },
    { name: "Catálogo de Jogos", href: "/dashboard/jogos", icon: <Gamepad2 size={20} /> },
    { name: "Configurações", href: "/dashboard/config", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-outline-variant h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex justify-center w-full">
        <Link href="/">
          <Image src="/Teko_logo.svg" alt="Teko Logo" width={240} height={80} className="h-20 w-auto mb-8 hover:scale-105 transition-transform" />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-md transition-colors ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant">
        <button onClick={() => logoutAction()} className="flex items-center gap-3 w-full px-4 py-3 text-error hover:bg-error-container hover:text-on-error-container rounded-lg font-label-md transition-colors">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

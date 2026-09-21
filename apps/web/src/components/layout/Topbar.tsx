import React from "react";

import { getSession } from "../../actions/auth";
import { db } from "../../../../../packages/db/db/index";
import { users } from "../../../../../packages/db/db/schema";
import { eq } from "drizzle-orm";

const topbarTranslations: Record<string, { adminPanel: string; psychPanel: string; activeLicense: string; defaultName: string }> = {
  pt: {
    adminPanel: "Painel do Administrador",
    psychPanel: "Painel do Profissional",
    activeLicense: "Licença Ativa",
    defaultName: "Profissional"
  },
  en: {
    adminPanel: "Administrator Dashboard",
    psychPanel: "Professional Dashboard",
    activeLicense: "Active License",
    defaultName: "Professional"
  }
};

export async function Topbar({ lang = "pt" }: { lang?: string }) {
  const session = await getSession();
  const currentLang = lang === "en" ? "en" : "pt";
  const t = topbarTranslations[currentLang];

  let name = session?.name || t.defaultName;
  
  if (session?.sub) {
    const [dbUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, session.sub));
    if (dbUser) {
      name = dbUser.name;
    }
  }

  const initials = name.charAt(0).toUpperCase();

  return (
    <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-xl bg-black/20">
      <div>
        <h2 className="font-headline-md text-white font-bold">
          {session?.role === "GLOBAL_ADMIN" ? t.adminPanel : t.psychPanel}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-10 h-10 rounded-xl bg-teko-yellow text-on-secondary-fixed flex items-center justify-center font-bold font-label-md shadow-[0_0_15px_rgba(230,168,0,0.3)]">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-[14px] font-bold text-white">{name}</p>
            <p className="text-[12px] font-body-md text-[#7B61FF] font-bold">{t.activeLicense}</p>
          </div>
        </div>
      </div>
    </header>
  );
}


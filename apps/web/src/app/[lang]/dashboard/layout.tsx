import React from "react";
import { Sidebar } from "../../../components/layout/Sidebar";
import { Topbar } from "../../../components/layout/Topbar";
import { getSession } from "../../../actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children, params }: { children: React.ReactNode, params: Promise<{ lang: string }> }) {
  const session = await getSession();
  
  if (!session) {
    const resolvedParams = await params;
    const lang = resolvedParams?.lang || "pt";
    redirect(`/${lang}`);
  }

  return (
    <div className="min-h-screen bg-deep-forest text-white flex">
      <Sidebar role={session?.role} />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

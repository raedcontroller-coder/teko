import React from "react";
import { Sidebar } from "../../../components/layout/Sidebar";
import { Topbar } from "../../../components/layout/Topbar";
import { getSession } from "../../../actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

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

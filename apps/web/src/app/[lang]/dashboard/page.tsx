import React from "react";
import { getSession } from "../../../actions/auth";
import AdminDashboard from "./AdminDashboard";
import PsychologistDashboard from "./PsychologistDashboard";

export default async function DashboardRoot({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang || "pt";
  const session = await getSession();

  if (session?.role === "GLOBAL_ADMIN") {
    return <AdminDashboard lang={lang} />;
  }

  return <PsychologistDashboard />;
}

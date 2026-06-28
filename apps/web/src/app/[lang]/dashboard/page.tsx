import React from "react";
import { getSession } from "../../../actions/auth";
import AdminDashboard from "./AdminDashboard";
import PsychologistDashboard from "./PsychologistDashboard";

export default async function DashboardRoot() {
  const session = await getSession();

  if (session?.role === "GLOBAL_ADMIN") {
    return <AdminDashboard />;
  }

  return <PsychologistDashboard />;
}

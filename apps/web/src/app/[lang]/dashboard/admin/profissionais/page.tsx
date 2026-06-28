import React from "react";
import { listPsicologosAction } from "../../../../../actions/admin";
import ProfissionaisClient from "./ProfissionaisClient";

export default async function ProfissionaisPage() {
  const dbPsicologos = await listPsicologosAction();

  return <ProfissionaisClient initialData={dbPsicologos} />;
}

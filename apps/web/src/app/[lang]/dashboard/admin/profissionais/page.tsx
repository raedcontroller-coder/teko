import React from "react";
import { listPsicologosAction } from "../../../../../actions/admin";
import ProfissionaisClient from "./ProfissionaisClient";

export default async function ProfissionaisPage() {
  const dbPsicologos = await listPsicologosAction();

  // Dados mocados para manter o visual populado, caso o DB esteja vazio
  const mockPsicologos = [
    { id: "mock-1", name: "Dr. Carlos Eduardo", email: "carlos@teko.com.br", crp: "06/12345", clinicName: "Clínica Crescer", createdAt: new Date(), childrenCount: 14, reportsCount: 42 },
    { id: "mock-2", name: "Dra. Beatriz Lima", email: "beatriz@teko.com.br", crp: "06/98765", clinicName: "Espaço Infância", createdAt: new Date(), childrenCount: 8, reportsCount: 15 },
    { id: "mock-3", name: "Dr. Roberto Alves", email: "roberto@teko.com.br", crp: "04/55214", clinicName: "Terapia Viva", createdAt: new Date(), childrenCount: 22, reportsCount: 89 },
    { id: "mock-4", name: "Dra. Fernanda Costa", email: "fernanda@teko.com.br", crp: "05/11299", clinicName: "Mente Sã", createdAt: new Date(), childrenCount: 5, reportsCount: 7 },
    { id: "mock-5", name: "Dr. Marcelo Santos", email: "marcelo@teko.com.br", crp: "02/88123", clinicName: "Núcleo Desenvolver", createdAt: new Date(), childrenCount: 18, reportsCount: 51 },
    { id: "mock-6", name: "Dra. Juliana Mendes", email: "juliana@teko.com.br", crp: "06/44710", clinicName: "Clínica Sorrir", createdAt: new Date(), childrenCount: 11, reportsCount: 24 },
    { id: "mock-7", name: "Dr. Thiago Pereira", email: "thiago@teko.com.br", crp: "08/33091", clinicName: "Desenvolvimento Infantil", createdAt: new Date(), childrenCount: 31, reportsCount: 112 },
  ];

  const psicologos = [...dbPsicologos, ...mockPsicologos];

  return <ProfissionaisClient initialData={psicologos} />;
}

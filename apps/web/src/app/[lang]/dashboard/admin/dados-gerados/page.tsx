import React from "react";
import { getAdminDadosGeradosAction } from "@/actions/admin";
import DadosGeradosClient from "./DadosGeradosClient";

export default async function AdminDadosGeradosPage() {
  const response = await getAdminDadosGeradosAction();
  
  if (response.error) {
    return (
      <div className="w-full pb-16 animate-fade-in flex flex-col items-center justify-center mt-20">
        <h2 className="text-xl font-bold text-red-500 mb-2">Erro ao carregar os dados</h2>
        <p className="text-white/70">{response.error}</p>
      </div>
    );
  }

  const rawData = response.data || [];

  return <DadosGeradosClient rawData={rawData} />;
}

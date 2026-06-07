"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/Input";
import { Card } from "../../../../../components/ui/Card";
import { registerPsicologoAction } from "../../../../../actions/admin";

export default function NovoPsicologoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerPsicologoAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      router.push("/dashboard/admin");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/admin">
          <Button variant="ghost" className="p-3">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-semibold text-on-surface">Novo Psicólogo</h1>
          <p className="text-on-surface-variant mt-1">Preencha os dados abaixo para cadastrar um novo profissional.</p>
        </div>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg font-body-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nome Completo *" name="name" required placeholder="Ex: Dra. Ana Souza" />
            <Input label="E-mail *" name="email" type="email" required placeholder="ana@clinica.com" />
            
            <Input label="CPF *" name="cpf" required placeholder="000.000.000-00" />
            <Input label="Senha Temporária *" name="password" type="password" required placeholder="******" />
            
            <Input label="CRP (Opcional)" name="crp" placeholder="00/00000" />
            <Input label="Nome da Clínica (Opcional)" name="clinicName" placeholder="Clínica Mente Viva" />
          </div>

          <div className="flex justify-end pt-4 border-t border-outline-variant">
            <Button type="submit" disabled={loading} className="min-w-[150px]">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Save size={20} className="mr-2" />
                  Cadastrar
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

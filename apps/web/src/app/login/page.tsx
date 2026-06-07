"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { loginAction } from "../../actions/auth";

export default function Login() {
  const [role, setRole] = useState<"PSICOLOGO" | "GLOBAL_ADMIN">("PSICOLOGO");
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    formData.append("role", role);
    setError("");
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="max-w-[448px] w-full bg-white rounded-xl soft-shadow p-lg">
        <div className="text-center mb-lg flex flex-col items-center">
          <Image src="/Teko_logo.svg" alt="Teko Logo" width={240} height={80} className="h-20 w-auto mb-4" />
          <h1 className="font-headline-lg text-[32px] font-bold text-primary mb-xs">
            Bem-vindo
          </h1>
          <p className="font-body-md text-[16px] text-on-surface-variant">
            Faça login para acessar seu painel.
          </p>
        </div>

        <div className="flex bg-surface-container rounded-lg p-1 mb-md">
          <button
            onClick={() => setRole("PSICOLOGO")}
            className={`flex-1 py-2 font-label-md rounded-md transition-all ${
              role === "PSICOLOGO"
                ? "bg-white shadow-sm text-primary"
                : "text-on-surface-variant hover:bg-white/50"
            }`}
          >
            Sou Psicólogo
          </button>
          <button
            onClick={() => setRole("GLOBAL_ADMIN")}
            className={`flex-1 py-2 font-label-md rounded-md transition-all ${
              role === "GLOBAL_ADMIN"
                ? "bg-white shadow-sm text-primary"
                : "text-on-surface-variant hover:bg-white/50"
            }`}
          >
            Administrador
          </button>
        </div>

        <form className="flex flex-col gap-md" action={handleSubmit}>
          {error && (
            <div className="bg-error-container text-on-error-container p-3 rounded-md font-label-md">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-primary" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              className="w-full border border-outline-variant rounded-lg p-3 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-primary" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              className="w-full border border-outline-variant rounded-lg p-3 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4" />
              <span className="font-body-md text-[14px] text-on-surface-variant">Lembrar de mim</span>
            </label>
            <a href="#" className="font-body-md text-[14px] text-primary hover:underline">
              Esqueceu a senha?
            </a>
          </div>

          <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-headline-md text-[16px] hover:opacity-90 transition-all mt-4">
            Entrar
          </button>
        </form>

        <div className="mt-lg text-center">
          <Link href="/" className="font-body-md text-[14px] text-on-surface-variant hover:text-primary">
            &larr; Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { loginAction } from "../../../actions/auth";
import { Input } from "../../../components/ui/Input";

export default function Login() {
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
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

        <form className="flex flex-col gap-md" action={handleSubmit}>
          {error && (
            <div className="bg-error-container text-on-error-container p-3 rounded-md font-label-md">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Input
              id="email"
              name="email"
              type="email"
              label="E-mail"
              placeholder="Digite seu e-mail"
              className="bg-white font-body-md"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Senha"
              placeholder="Digite sua senha"
              className="bg-white font-body-md"
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

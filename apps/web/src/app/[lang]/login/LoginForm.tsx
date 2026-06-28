"use client";

import { useActionState } from "react";
import { loginAction } from "../../../actions/auth";
import Link from "next/link";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="w-full space-y-stack-md">
      {state?.error && (
        <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm mb-4">
          {state.error}
        </div>
      )}
      
      {/* Hidden input for language routing */}
      <input type="hidden" name="lang" value="pt" />
      
      {/* Email Field */}
      <div className="space-y-1">
        <label className="font-label-md text-sm ml-1 text-white/90" htmlFor="email">E-mail</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">mail</span>
          <input
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
            id="email"
            name="email"
            placeholder="nome@psicologo.com.br"
            type="email"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1">
        <div className="flex justify-between items-center px-1">
          <label className="font-label-md text-sm text-white/90" htmlFor="password">Senha</label>
          <Link className="font-label-md text-sm text-white font-bold hover:text-teko-yellow transition-colors" href="#">Esqueci minha senha</Link>
        </div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-teko-yellow transition-colors">lock</span>
          <input
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/20 border-2 border-white/10 text-white placeholder:text-white/40 focus:border-teko-yellow focus:ring-0 focus:outline-none transition-all"
            id="password"
            name="password"
            placeholder="••••••••"
            type="password"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        disabled={isPending}
        className="w-full mt-stack-lg py-4 rounded-xl bg-teko-yellow text-deep-forest font-cta-lg font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(230,168,0,0.2)] hover:shadow-[0_0_30px_rgba(230,168,0,0.4)] disabled:opacity-70 disabled:cursor-not-allowed" 
        type="submit"
      >
        {isPending ? "Entrando..." : "Entrar"}
        {!isPending && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>
    </form>
  );
}

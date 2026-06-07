"use client";

import React, { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="font-label-md text-on-surface-variant">{label}</label>}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-4 py-3 bg-surface-variant text-on-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary transition-colors ${isPassword ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
            title={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <span className="text-error font-body-sm mt-1">{error}</span>}
    </div>
  );
}

import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-label-md rounded-md transition-all active:scale-95";
  
  const variants = {
    primary: "bg-teko-yellow text-on-secondary-fixed hover:brightness-110 shadow-[0_4px_14px_rgba(230,168,0,0.39)]",
    secondary: "border-2 border-white/20 text-white hover:border-teko-yellow hover:text-teko-yellow hover:bg-white/5",
    accent: "bg-[#7B61FF] text-white hover:brightness-110 shadow-[0_4px_14px_rgba(123,97,255,0.39)]",
    ghost: "text-white/70 hover:bg-white/10 hover:text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-[12px]",
    md: "px-6 py-2 text-[14px]",
    lg: "px-8 py-3 text-[16px]",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

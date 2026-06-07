import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-label-md rounded-md transition-all active:scale-95";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:opacity-90 shadow-sm",
    secondary: "border-2 border-primary text-primary hover:bg-primary-fixed-dim/10",
    accent: "bg-secondary-container text-on-secondary-container hover:opacity-90 shadow-sm",
    ghost: "text-on-surface-variant hover:bg-surface-variant",
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

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "neutral" | "success" | "error";
  className?: string;
}

export function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  const variants = {
    primary: "bg-primary-fixed text-on-primary-fixed-variant",
    secondary: "bg-secondary-container text-on-secondary-container",
    neutral: "bg-surface-variant text-on-surface-variant",
    success: "bg-[#D8E6CC] text-[#2E5C14]",
    error: "bg-error-container text-on-error-container",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full font-label-md text-[12px] font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

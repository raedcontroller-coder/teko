import React, { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`glass-panel border-black/50 bg-black/20 rounded-xl p-6 ${
        interactive ? "hover:-translate-y-1 hover:border-teko-yellow transition-all duration-300 shadow-[0_5px_20px_rgba(0,0,0,0.3)] cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

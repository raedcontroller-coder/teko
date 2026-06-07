import React, { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#E5DEC9] rounded-xl p-6 ${
        interactive ? "hover:-translate-y-1 hover:border-primary transition-all duration-300 soft-shadow cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

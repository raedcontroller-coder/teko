import React from "react";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-black/50 glass-panel bg-black/20 shadow-lg">
      <table className="w-full text-left border-collapse">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-black/30 font-label-md text-white/60 border-b border-black/50">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="font-body-md text-white divide-y divide-black/50">{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tr className={`hover:bg-white/5 transition-colors ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 ${className}`} {...props}>{children}</td>;
}

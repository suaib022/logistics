import React from 'react';

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[12px] mb-4">
      <div className="h-[14px] w-[14px] bg-[var(--accent)]" />
      <span className="text-[14px] uppercase tracking-[0.02em] font-medium text-[var(--text)]">
        {children}
      </span>
    </div>
  );
}

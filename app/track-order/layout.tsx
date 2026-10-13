import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ToastProvider } from '@/components/ui/Toast';

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-[var(--bg)] flex flex-col">
        {/* Public Header: Logo at top left, Theme toggle at top right, NO sidebar */}
        <header className="w-full border-b border-[var(--border)] bg-[var(--surface-muted)] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <Link href="/orders" className="flex items-center hover:opacity-85 transition-opacity" aria-label="Ciketo">
            <Logo className="h-6 w-auto text-[var(--text)]" />
          </Link>
          <ThemeToggle />
        </header>

        {/* Public Content Container */}
        <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}

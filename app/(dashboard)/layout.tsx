"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Search, Menu } from 'lucide-react';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';

import { Logo } from '@/components/Logo';

const navItems = [
  { href: '/orders', label: 'Orders', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/quotes', label: 'Quotes', icon: <FileText className="w-5 h-5" /> },
  { href: '/track-order', label: 'Track Order', icon: <Search className="w-5 h-5" /> },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string, onNavigate?: () => void }) {
  return (
    <>
      <div className="p-6 border-b border-[var(--border)] flex items-center justify-between" style={{ minHeight: '80px' }}>
        <Link href="/orders" className="flex items-center hover:opacity-85 transition-opacity" aria-label="Ciketo Dashboard">
          <Logo className="h-[22px] w-auto text-[var(--text)]" />
        </Link>
        <ThemeToggle />
      </div>
      <nav className="p-4 space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
              onClick={onNavigate}
            >
              {isActive && <div className="absolute left-4 w-1.5 h-1.5 bg-[var(--accent)]" />}
              <span className={isActive ? 'ml-3' : ''}>{item.icon}</span>
              <span className="font-medium text-[15px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[264px] shrink-0 bg-[var(--surface-muted)] border-r border-[var(--border)] h-full">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile Header & Drawer */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--surface-muted)] border-b border-[var(--border)] flex items-center justify-between px-4 z-40">
          <Link href="/orders" className="flex items-center hover:opacity-85 transition-opacity" aria-label="Ciketo Dashboard">
            <Logo className="h-[20px] w-auto text-[var(--text)]" />
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-[264px] bg-[var(--surface-muted)] h-full flex flex-col shadow-xl">
              <SidebarContent pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto h-full mt-16 md:mt-0 relative">
          <div className="max-w-[1280px] mx-auto p-4 md:p-[40px]">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

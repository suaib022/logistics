import React from 'react';
import { X } from 'lucide-react';

interface EntityDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function EntityDrawer({ open, onClose, title, children }: EntityDrawerProps) {
  const [cachedTitle, setCachedTitle] = React.useState(title);
  const [cachedChildren, setCachedChildren] = React.useState(children);

  React.useEffect(() => {
    if (open) {
      setCachedTitle(title);
      setCachedChildren(children);
    }
  }, [open, title, children]);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${open ? 'visible' : 'invisible pointer-events-none'}`}>
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      <div className={`relative z-50 w-full max-w-2xl h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-xl flex flex-col transform transition-transform duration-300 overflow-hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]">
          <h2 className="text-[20px] font-medium text-[var(--text)]">{open ? title : cachedTitle}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--border)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {open ? children : cachedChildren}
        </div>
      </div>
    </div>
  );
}

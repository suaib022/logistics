import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}

export function FormSection({ title, children, collapsible }: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(!collapsible);

  return (
    <div className="mb-4">
      <div 
        className={`flex items-center gap-4 mb-3 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <h3 className="text-[20px] font-medium text-[var(--text)] whitespace-nowrap">{title}</h3>
        <div className="h-[1px] bg-[var(--border)] flex-grow" />
        {collapsible && (
          <span className="text-[var(--text-secondary)] text-sm">
            {isOpen ? 'Collapse' : 'Expand'}
          </span>
        )}
      </div>
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[20px] gap-y-[16px]">
          {children}
        </div>
      )}
    </div>
  );
}

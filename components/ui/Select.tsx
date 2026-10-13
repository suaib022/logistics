import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`appearance-none flex h-[40px] w-full rounded-[4px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-[16px] pr-[36px] text-sm text-[var(--text)] transition-colors placeholder:text-[var(--placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--text)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-[12px] flex items-center">
          <ChevronDown className="h-5 w-5 text-[var(--text-secondary)]" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

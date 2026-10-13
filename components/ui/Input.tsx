import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-[40px] w-full rounded-[4px] border border-[var(--input-border)] bg-[var(--input-bg)] px-[16px] text-sm text-[var(--text)] transition-colors placeholder:text-[var(--placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--text)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

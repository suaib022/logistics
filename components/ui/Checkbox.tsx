import React, { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={`peer h-[32px] w-[32px] shrink-0 appearance-none rounded-[4px] border border-[var(--input-border)] bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--text)] focus:ring-offset-2 checked:bg-black checked:border-black disabled:cursor-not-allowed disabled:opacity-50 relative ${className}`}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

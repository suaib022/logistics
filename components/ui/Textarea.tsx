import React, { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`flex min-h-[100px] w-full resize-y rounded-[4px] border border-[var(--input-border)] bg-[var(--input-bg)] px-[16px] py-[12px] text-sm text-[var(--text)] transition-colors placeholder:text-[var(--placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--text)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

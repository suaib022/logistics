import React from 'react';
import { getOrderStatus, getQuoteStatus, ColorToken } from '@/lib/status';

interface Props {
  status: string;
  type: 'order' | 'quote';
  className?: string;
}

const colorMap: Record<ColorToken, string> = {
  neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]',
  blue: 'bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]',
  accent: 'bg-[var(--status-accent-bg)] text-[var(--status-accent-text)]',
  teal: 'bg-[var(--status-teal-bg)] text-[var(--status-teal-text)]',
  green: 'bg-[var(--status-green-bg)] text-[var(--status-green-text)]',
  amber: 'bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]',
  red: 'bg-[var(--status-red-bg)] text-[var(--status-red-text)]',
};

export function StatusBadge({ status, type, className = '' }: Props) {
  let label = status;
  let colorClass = colorMap.neutral;

  if (type === 'order') {
    const s = getOrderStatus(status);
    if (s) {
      label = s.label;
      colorClass = colorMap[s.color];
    }
  } else {
    const s = getQuoteStatus(status);
    if (s) {
      label = s.label;
      // All quote statuses will be neutral for now or we can customize
      // based on logic (e.g. accepted -> green, rejected -> red)
      if (s.slug === 'accepted') colorClass = colorMap.green;
      else if (s.slug === 'rejected' || s.slug === 'cancelled' || s.slug === 'expired') colorClass = colorMap.red;
      else if (s.slug === 'under_review' || s.slug === 'rates_prepared') colorClass = colorMap.amber;
      else if (s.slug === 'sent_to_customer') colorClass = colorMap.blue;
      else colorClass = colorMap.neutral;
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}

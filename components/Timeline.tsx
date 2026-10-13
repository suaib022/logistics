import React from 'react';
import { format } from 'date-fns';
import { getOrderStatus } from '@/lib/status';
import { Package, Truck, Ship, Plane, CheckCircle, AlertTriangle, FileText, Anchor, MapPin } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  status: string;
  location: string | null;
  note: string | null;
  occurred_at: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

function getIconForStatus(status: string) {
  const cat = getOrderStatus(status)?.category;
  if (cat === 'exception') return <AlertTriangle className="w-5 h-5 text-white" />;
  if (cat === 'final' && status === 'delivered') return <CheckCircle className="w-5 h-5 text-white" />;
  if (cat === 'final') return <AlertTriangle className="w-5 h-5 text-white" />;
  if (cat === 'pre_shipment') return <FileText className="w-5 h-5 text-white" />;
  if (cat === 'pickup_origin') return <Package className="w-5 h-5 text-white" />;
  if (status.includes('transit')) return <Ship className="w-5 h-5 text-white" />; // simplify icon logic
  if (status.includes('departed')) return <Plane className="w-5 h-5 text-white" />;
  if (status.includes('destination')) return <Anchor className="w-5 h-5 text-white" />;
  return <Truck className="w-5 h-5 text-white" />;
}

export function Timeline({ events }: TimelineProps) {
  if (!events.length) return null;

  // sort by occurred_at desc
  const sorted = [...events].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  return (
    <div className="relative border-l border-[var(--border)] ml-6 my-6">
      {sorted.map((event, i) => {
        const s = getOrderStatus(event.status);
        const isCurrent = i === 0;
        let colorClass = 'bg-[var(--text-muted)] ring-[var(--text-muted)]'; // default
        
        if (s) {
          if (s.color === 'blue') colorClass = 'bg-[var(--status-blue-bg)] ring-[var(--status-blue-bg)]';
          else if (s.color === 'accent') colorClass = 'bg-[var(--status-accent-bg)] ring-[var(--status-accent-bg)]';
          else if (s.color === 'teal') colorClass = 'bg-[var(--status-teal-bg)] ring-[var(--status-teal-bg)]';
          else if (s.color === 'green') colorClass = 'bg-[var(--status-green-bg)] ring-[var(--status-green-bg)]';
          else if (s.color === 'amber') colorClass = 'bg-[var(--status-amber-bg)] ring-[var(--status-amber-bg)]';
          else if (s.color === 'red') colorClass = 'bg-[var(--status-red-bg)] ring-[var(--status-red-bg)]';
        }

        return (
          <div key={event.id} className="mb-10 ml-8 relative">
            <span className={`absolute flex items-center justify-center w-10 h-10 rounded-full -left-13 ring-4 ring-white ${colorClass}`}>
              {getIconForStatus(event.status)}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className={`flex items-center text-lg font-medium ${isCurrent ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]'}`}>
                {s?.label || event.status}
              </h3>
              <time className="block text-sm font-normal leading-none text-[var(--text-muted)]">
                {format(new Date(event.occurred_at), 'PPpp')}
              </time>
              {(event.location || event.note) && (
                <div className="mt-2 text-base text-[var(--text-secondary)] bg-[var(--surface-muted)] p-3 rounded-md border border-[var(--border)]">
                  {event.location && <div className="flex items-center gap-1 mb-1 font-medium"><MapPin className="w-4 h-4"/> {event.location}</div>}
                  {event.note && <div className="text-sm">{event.note}</div>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

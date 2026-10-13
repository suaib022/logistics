"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { Timeline } from '@/components/Timeline';
import { normalizeOrderId, isValidOrderId } from '@/lib/ids';
import { getOrderStatus } from '@/lib/status';
import { format } from 'date-fns';

export function TrackOrderClient({ initialOrder, initialSearch }: { initialOrder: any; initialSearch: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch || '');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    const normalized = normalizeOrderId(search);
    if (!isValidOrderId(normalized)) {
      setError('Invalid format. Expected CKT-YYYY-NNNNNN');
      return;
    }

    setError('');
    router.push(`/track-order?id=${normalized}`);
  };

  const currentStatus = initialOrder?.status;
  const s = currentStatus ? getOrderStatus(currentStatus) : null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center">
      <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-4 mb-12">
        <div className="flex-1">
          <Input
            placeholder="Enter your order ID (e.g. CKT-2026-100001)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <Button type="submit">Track Order</Button>
      </form>

      {initialSearch && !initialOrder && !error && (
        <div className="text-center p-12 bg-[var(--surface-muted)] rounded-lg border border-[var(--border)] w-full">
          <h2 className="text-xl font-medium mb-2">No order found</h2>
          <p className="text-[var(--text-secondary)]">We couldn't find an order with ID <span className="font-mono">{normalizeOrderId(initialSearch)}</span>.</p>
          <p className="text-[var(--text-muted)] mt-4">Moving What Matters, Wherever It Needs to Go.</p>
        </div>
      )}

      {initialOrder && (
        <div className="w-full flex flex-col gap-8">
          <div className="bg-[var(--surface-muted)] p-6 rounded-xl border border-[var(--border)] flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-1">Order ID</p>
                <h2 className="text-2xl font-mono font-medium">{initialOrder.order_id}</h2>
              </div>
              <StatusBadge status={initialOrder.status} type="order" className="scale-110 origin-top-right" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-t border-[var(--border)] pt-6">
              <div>
                <p className="text-[var(--text-muted)] mb-1">Customer</p>
                <p className="font-medium text-[var(--text)]">{initialOrder.customer_name}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] mb-1">Route</p>
                <p className="font-medium text-[var(--text)]">{initialOrder.origin} → {initialOrder.destination}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] mb-1">Method</p>
                <p className="font-medium text-[var(--text)] capitalize">{initialOrder.shipping_method}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] mb-1">ETA</p>
                <p className="font-medium text-[var(--text)]">
                  {initialOrder.estimated_delivery_date ? format(new Date(initialOrder.estimated_delivery_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
            </div>

            {/* Progress Tracker Placeholder - could extract to component */}
            {s?.category === 'exception' || s?.category === 'final' && currentStatus !== 'delivered' ? (
              <div className="bg-[var(--status-red-bg)] border border-[var(--status-red-text)] p-4 rounded-md mt-4">
                <p className="text-[var(--status-red-text)] font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--status-red-text)]" />
                  Alert: {s.label}
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden w-full relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[var(--text)] transition-all"
                    style={{ 
                      width: 
                        s?.category === 'pre_shipment' ? '15%' :
                        s?.category === 'pickup_origin' ? '35%' :
                        s?.category === 'movement' ? '65%' :
                        s?.category === 'destination_delivery' ? '90%' :
                        s?.category === 'final' ? '100%' : '0%'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2 font-medium">
                  <span>Placed</span>
                  <span className="hidden md:inline">Approved</span>
                  <span>Origin</span>
                  <span>In Transit</span>
                  <span>Destination</span>
                  <span>Delivered</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-medium mb-6">Tracking History</h3>
            <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
              <Timeline events={initialOrder.order_events || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

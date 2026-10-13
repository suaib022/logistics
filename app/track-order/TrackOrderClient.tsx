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
import { Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface TrackOrderClientProps {
  initialOrder: any;
  initialSearch: string;
  initialPhone: string;
  verificationError: string | null;
  notFound: boolean;
}

export function TrackOrderClient({
  initialOrder,
  initialSearch,
  initialPhone,
  verificationError,
  notFound,
}: TrackOrderClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    const normalized = normalizeOrderId(search);
    if (!isValidOrderId(normalized)) {
      setError('Invalid format. Expected CKT-YYYY-NNNNNN');
      return;
    }

    setError('');
    const query = new URLSearchParams();
    query.set('id', normalized);
    if (phone.trim()) {
      query.set('phone', phone.trim());
    }
    router.push(`/track-order?${query.toString()}`);
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (initialOrder?.order_id) {
      url.searchParams.set('id', initialOrder.order_id);
    }
    if (phone.trim()) {
      url.searchParams.set('phone', phone.trim());
    }
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentStatus = initialOrder?.status;
  const s = currentStatus ? getOrderStatus(currentStatus) : null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center">
      <form onSubmit={handleSearch} className="w-full max-w-xl flex flex-col gap-3 mb-10">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
            Order Identification
          </label>
          <Input
            placeholder="Enter your order ID (e.g. CKT-2026-100001)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1 flex items-center justify-between">
            <span>Customer Phone Number</span>
            <span className="text-[var(--text-muted)] normal-case text-xs font-normal">For security verification</span>
          </label>
          <Input
            type="tel"
            placeholder="Enter phone number (e.g. +1 555-0199)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-[var(--status-red-text)]">{error}</p>}

        <Button type="submit" className="w-full mt-2">
          Track Order
        </Button>
      </form>

      {/* Verification Error Notice */}
      {verificationError && !notFound && (
        <div className="w-full mb-8 p-5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text)]">Verification Required</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{verificationError}</p>
          </div>
        </div>
      )}

      {/* Not Found Notice */}
      {notFound && (
        <div className="text-center p-12 bg-[var(--surface-muted)] rounded-lg border border-[var(--border)] w-full mb-8">
          <h2 className="text-xl font-medium mb-2 text-[var(--text)]">No order found</h2>
          <p className="text-[var(--text-secondary)]">
            We couldn't find an order with ID <span className="font-mono">{normalizeOrderId(initialSearch)}</span>.
          </p>
          <p className="text-[var(--text-muted)] mt-4">Moving What Matters, Wherever It Needs to Go.</p>
        </div>
      )}

      {/* Verified Order Details */}
      {initialOrder && (
        <div className="w-full flex flex-col gap-8">
          <div className="bg-[var(--surface-muted)] p-6 rounded-xl border border-[var(--border)] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Order ID</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Verified
                  </span>
                </div>
                <h2 className="text-2xl font-mono font-medium text-[var(--text)]">{initialOrder.order_id}</h2>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-3 h-auto"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied' : 'Share Link'}</span>
                </Button>
                <StatusBadge status={initialOrder.status} type="order" className="scale-110 origin-top-right" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-t border-[var(--border)] pt-6">
              <div>
                <p className="text-[var(--text-muted)] mb-1">Customer</p>
                <p className="font-medium text-[var(--text)]">{initialOrder.customer_name}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] mb-1">Route</p>
                <p className="font-medium text-[var(--text)]">
                  {initialOrder.origin} → {initialOrder.destination}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] mb-1">Method</p>
                <p className="font-medium text-[var(--text)] capitalize">{initialOrder.shipping_method}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] mb-1">ETA</p>
                <p className="font-medium text-[var(--text)]">
                  {initialOrder.estimated_delivery_date
                    ? format(new Date(initialOrder.estimated_delivery_date), 'MMM d, yyyy')
                    : '-'}
                </p>
              </div>
            </div>

            {/* Progress Tracker */}
            {s?.category === 'exception' || (s?.category === 'final' && currentStatus !== 'delivered') ? (
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
                        s?.category === 'pre_shipment'
                          ? '15%'
                          : s?.category === 'pickup_origin'
                          ? '35%'
                          : s?.category === 'movement'
                          ? '65%'
                          : s?.category === 'destination_delivery'
                          ? '90%'
                          : s?.category === 'final'
                          ? '100%'
                          : '0%',
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
            <h3 className="text-xl font-medium mb-6 text-[var(--text)]">Tracking History</h3>
            <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)]">
              <Timeline events={initialOrder.order_events || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

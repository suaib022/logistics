import React from 'react';
export const instant = false;
import { getSupabase } from '@/lib/supabase/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TrackOrderClient } from './TrackOrderClient';

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ id?: string }> | { id?: string } }) {
  const params = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const orderId = params?.id || '';

  const supabase = getSupabase();
  let initialOrder = null;
  let error = null;

  if (supabase && orderId) {
    const { data, error: err } = await supabase
      .from('orders')
      .select('*, order_events(*)')
      .eq('order_id', orderId)
      .single();

    if (err && err.code !== 'PGRST116') {
      error = err.message;
    } else {
      initialOrder = data;
    }
  }

  return (
    <div>
      <Eyebrow>Track Order</Eyebrow>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-[clamp(36px,5vw,60px)] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--text)]">
          Track your shipment
        </h1>
      </div>
      <TrackOrderClient initialOrder={initialOrder} initialSearch={orderId} />
    </div>
  );
}

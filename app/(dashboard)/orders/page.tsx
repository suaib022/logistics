import React from 'react';
export const instant = false;
import { getSupabase } from '@/lib/supabase/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
  const supabase = getSupabase();
  if (!supabase) {
    return <div className="p-8 text-center"><h1 className="text-2xl font-semibold mb-4">Setup required</h1><p>Missing Supabase URL or Service Role Key in environment variables.</p></div>;
  }

  // Fetch orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_events(*)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-600">Error loading orders: {error.message}</div>;
  }

  return (
    <div>
      <Eyebrow>Orders</Eyebrow>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-[clamp(36px,5vw,60px)] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--text)]">
          All Orders
        </h1>
      </div>
      <OrdersClient initialOrders={orders || []} />
    </div>
  );
}

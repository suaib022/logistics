import React from 'react';
export const instant = false;
import { getSupabase } from '@/lib/supabase/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { normalizeOrderId } from '@/lib/ids';
import { TrackOrderClient } from './TrackOrderClient';

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; phone?: string }> | { id?: string; phone?: string };
}) {
  const params = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const rawId = params?.id || '';
  const phone = (params?.phone || '').trim();
  const orderId = rawId ? normalizeOrderId(rawId) : '';

  const supabase = getSupabase();
  let initialOrder = null;
  let verificationError: string | null = null;
  let notFound = false;

  if (supabase && orderId) {
    const { data, error: err } = await supabase
      .from('orders')
      .select('*, order_events(*)')
      .eq('order_id', orderId)
      .single();

    if (err || !data) {
      if (!err || err.code === 'PGRST116') {
        notFound = true;
      } else {
        verificationError = err.message;
      }
    } else {
      // Order found -> verify phone number
      if (!phone) {
        if (!data.phone) {
          // If no phone on record in DB, allow access
          initialOrder = data;
        } else {
          verificationError = 'Please enter your phone number to verify and view tracking details.';
        }
      } else {
        const orderDigits = (data.phone || '').replace(/\D/g, '');
        const inputDigits = phone.replace(/\D/g, '');
        const isMatch = Boolean(
          !orderDigits ||
          (orderDigits &&
            inputDigits &&
            (orderDigits === inputDigits ||
              (orderDigits.length >= 7 &&
                inputDigits.length >= 7 &&
                orderDigits.slice(-7) === inputDigits.slice(-7))))
        );

        if (isMatch) {
          initialOrder = data;
        } else {
          verificationError =
            'Phone number does not match this order. Please enter the contact phone number used when placing the order.';
        }
      }
    }
  }

  return (
    <div>
      <Eyebrow>Public Shipment Tracking</Eyebrow>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-[clamp(32px,5vw,52px)] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--text)]">
          Track your shipment
        </h1>
      </div>
      <TrackOrderClient
        initialOrder={initialOrder}
        initialSearch={orderId}
        initialPhone={phone}
        verificationError={verificationError}
        notFound={notFound}
      />
    </div>
  );
}

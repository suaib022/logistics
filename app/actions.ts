'use server';

import { getSupabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { OrderSchema, QuoteSchema } from '@/lib/validation';

export async function createOrder(formData: unknown) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database connection not configured.' };

  const parsed = OrderSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: 'Invalid form data', details: parsed.error.format() };
  }

  const { data, error } = await supabase.from('orders').insert([parsed.data]).select('order_id').single();

  if (error) {
    console.error('Error creating order:', error);
    return { error: 'Failed to create order. ' + error.message };
  }

  revalidatePath('/orders');
  return { success: true, orderId: data.order_id };
}

export async function createQuote(formData: unknown) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database connection not configured.' };

  const parsed = QuoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: 'Invalid form data', details: parsed.error.format() };
  }

  const { data, error } = await supabase.from('quotes').insert([parsed.data]).select('quote_id').single();

  if (error) {
    console.error('Error creating quote:', error);
    return { error: 'Failed to create quote. ' + error.message };
  }

  revalidatePath('/quotes');
  return { success: true, quoteId: data.quote_id };
}

export async function updateOrderStatus(orderId: string, status: string, location: string, note: string, dateStr?: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database connection not configured.' };

  const occurredAt = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();

  // Call the RPC function
  const { error } = await supabase.rpc('add_order_event', {
    p_order_uuid: orderId,
    p_status: status,
    p_location: location || null,
    p_note: note || null,
    p_occurred_at: occurredAt,
  });

  if (error) {
    console.error('Error updating status:', error);
    return { error: 'Failed to update status. ' + error.message };
  }

  revalidatePath('/orders');
  revalidatePath('/track-order');
  return { success: true };
}

export async function updateQuote(quoteId: string, updates: Record<string, unknown>) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database connection not configured.' };

  const { error } = await supabase.from('quotes').update(updates).eq('id', quoteId);

  if (error) {
    console.error('Error updating quote:', error);
    return { error: 'Failed to update quote. ' + error.message };
  }

  revalidatePath('/quotes');
  return { success: true };
}

export async function deleteOrder(id: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database connection not configured.' };

  const { error } = await supabase.from('orders').delete().eq('id', id);

  if (error) {
    return { error: 'Failed to delete order.' };
  }

  revalidatePath('/orders');
  return { success: true };
}

export async function deleteQuote(id: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Database connection not configured.' };

  const { error } = await supabase.from('quotes').delete().eq('id', id);

  if (error) {
    return { error: 'Failed to delete quote.' };
  }

  revalidatePath('/quotes');
  return { success: true };
}

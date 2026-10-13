import React from 'react';
export const instant = false;
import { getSupabase } from '@/lib/supabase/server';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { QuotesClient } from './QuotesClient';

export default async function QuotesPage() {
  const supabase = getSupabase();
  if (!supabase) {
    return <div className="p-8 text-center"><h1 className="text-2xl font-semibold mb-4">Setup required</h1><p>Missing Supabase URL or Service Role Key in environment variables.</p></div>;
  }

  // Fetch quotes
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-600">Error loading quotes: {error.message}</div>;
  }

  return (
    <div>
      <Eyebrow>Quotes</Eyebrow>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-[clamp(36px,5vw,60px)] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--text)]">
          All Quotes
        </h1>
      </div>
      <QuotesClient initialQuotes={quotes || []} />
    </div>
  );
}

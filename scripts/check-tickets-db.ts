import { config } from 'dotenv';
import path from 'path';

// Load environment configurations
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabase } from '../lib/supabase/server';

async function checkTicketsDb() {
  const supabase = getSupabase();
  if (!supabase) {
    console.log('skipped (no credentials)');
    process.exit(0);
  }

  try {
    console.log('Verifying Supabase connection and tickets database objects...');

    // 1. Verify tables exist
    const { error: ticketsTableErr } = await supabase.from('tickets').select('id').limit(1);
    if (ticketsTableErr) {
      console.error('FAIL: Error accessing "tickets" table:', ticketsTableErr.message);
      process.exit(1);
    }

    const { error: notesTableErr } = await supabase.from('ticket_notes').select('id').limit(1);
    if (notesTableErr) {
      console.error('FAIL: Error accessing "ticket_notes" table:', notesTableErr.message);
      process.exit(1);
    }

    // 2. Verify ticket_counts RPC exists
    const { data: countData, error: countErr } = await supabase.rpc('ticket_counts');
    if (countErr) {
      console.error('FAIL: Error calling "ticket_counts" RPC:', countErr.message);
      process.exit(1);
    }
    console.log('✔ Verified ticket_counts() RPC. Current counts:', countData);

    // 3. Smoke test: create a test ticket via create_ticket RPC
    const smokeDedupeKey = `smoke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { data: createData, error: createErr } = await supabase.rpc('create_ticket', {
      p: {
        customer_name: 'Smoke Test User',
        email: 'smoke.test@ciketo.example',
        summary: 'Smoke test ticket verification',
        source: 'dashboard',
        category: 'other',
        priority: 'low',
        dedupe_key: smokeDedupeKey,
      },
    });

    if (createErr || !createData?.id) {
      console.error('FAIL: Error executing "create_ticket" smoke test:', createErr?.message);
      process.exit(1);
    }

    const createdUuid = createData.id;
    console.log(`✔ Verified create_ticket() RPC. Created smoke ticket: ${createData.ticket_id} (${createdUuid})`);

    // 4. Verify initial trigger created a system note
    const { data: notes, error: notesErr } = await supabase
      .from('ticket_notes')
      .select('id, kind, body')
      .eq('ticket_uuid', createdUuid);

    if (notesErr || !notes || notes.length === 0) {
      console.error('FAIL: After-insert note trigger did not produce a system note.');
      process.exit(1);
    }
    console.log('✔ Verified after-insert system note trigger.');

    // 5. Clean up smoke test ticket
    const { error: deleteErr } = await supabase.from('tickets').delete().eq('id', createdUuid);
    if (deleteErr) {
      console.warn('Warning: Could not delete smoke test ticket:', deleteErr.message);
    } else {
      console.log('✔ Cleaned up smoke test ticket.');
    }

    console.log('\n======================================================');
    console.log('PASS: Tickets Supabase database layer is fully operational!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('FAIL: Unexpected exception during tickets DB check:', err.message);
    process.exit(1);
  }
}

checkTicketsDb();

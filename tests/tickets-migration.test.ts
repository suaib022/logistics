import { describe, it, expect, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

describe('Supabase Migration 003_tickets with PGlite', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    // 1. Create stub orders table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id text UNIQUE NOT NULL
      );
    `);

    // 2. Run the migration
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '003_tickets.sql'),
      'utf8'
    );
    await db.exec(migrationSql);
  });

  it('generates ticket IDs matching ^TKT-\\d{4}-\\d{4}$ and increasing', async () => {
    const res1 = await db.query<{ ticket_id: string }>(`
      INSERT INTO tickets (customer_name, summary)
      VALUES ('Alice', 'First test summary')
      RETURNING ticket_id;
    `);
    const res2 = await db.query<{ ticket_id: string }>(`
      INSERT INTO tickets (customer_name, summary)
      VALUES ('Bob', 'Second test summary')
      RETURNING ticket_id;
    `);

    const id1 = res1.rows[0].ticket_id;
    const id2 = res2.rows[0].ticket_id;

    const regex = /^TKT-\d{4}-\d{4}$/;
    expect(id1).toMatch(regex);
    expect(id2).toMatch(regex);

    // Sequence increases: e.g. TKT-2026-1001 and TKT-2026-1002
    const num1 = parseInt(id1.split('-')[2], 10);
    const num2 = parseInt(id2.split('-')[2], 10);
    expect(num2).toBe(num1 + 1);
  });

  it('sets expected default values on ticket insert', async () => {
    const res = await db.query<any>(`
      INSERT INTO tickets (customer_name, summary)
      VALUES ('Test User', 'Summary test')
      RETURNING *;
    `);
    const ticket = res.rows[0];
    expect(ticket.category).toBe('other');
    expect(ticket.priority).toBe('normal');
    expect(ticket.status).toBe('new');
    expect(ticket.source).toBe('dashboard');
    expect(ticket.is_handoff).toBe(false);
    expect(ticket.identity_verified).toBe(false);
    expect(ticket.created_at).toBeDefined();
    expect(ticket.updated_at).toBeDefined();
    expect(ticket.resolved_at).toBeNull();
  });

  it('rejects invalid values across all check constraints', async () => {
    // Bad category
    await expect(
      db.exec(`INSERT INTO tickets (customer_name, summary, category) VALUES ('A', 'Summ', 'invalid_cat')`)
    ).rejects.toThrow();

    // Bad priority
    await expect(
      db.exec(`INSERT INTO tickets (customer_name, summary, priority) VALUES ('A', 'Summ', 'super_urgent')`)
    ).rejects.toThrow();

    // Bad status
    await expect(
      db.exec(`INSERT INTO tickets (customer_name, summary, status) VALUES ('A', 'Summ', 'archived')`)
    ).rejects.toThrow();

    // Summary too short (< 3 chars)
    await expect(
      db.exec(`INSERT INTO tickets (customer_name, summary) VALUES ('A', 'Hi')`)
    ).rejects.toThrow();

    // Summary too long (> 200 chars)
    await expect(
      db.exec(`INSERT INTO tickets (customer_name, summary) VALUES ('A', '${'A'.repeat(201)}')`)
    ).rejects.toThrow();

    // Bad source
    await expect(
      db.exec(`INSERT INTO tickets (customer_name, summary, source) VALUES ('A', 'Summ', 'twitter')`)
    ).rejects.toThrow();

    // Valid ticket for note constraint tests
    const t = await db.query<{ id: string }>(`
      INSERT INTO tickets (customer_name, summary) VALUES ('User', 'Valid summary') RETURNING id;
    `);
    const tid = t.rows[0].id;

    // Bad note kind
    await expect(
      db.exec(`INSERT INTO ticket_notes (ticket_uuid, body, kind) VALUES ('${tid}', 'Note', 'invalid_kind')`)
    ).rejects.toThrow();

    // Empty note body (char_length < 1)
    await expect(
      db.exec(`INSERT INTO ticket_notes (ticket_uuid, body) VALUES ('${tid}', '')`)
    ).rejects.toThrow();
  });

  it('create_ticket trims strings, nulls empties, rejects agent tickets without contact, and accepts dashboard tickets', async () => {
    // 1. Dashboard ticket without contact succeeds
    const dashRes = await db.query<any>(`
      SELECT create_ticket('{
        "customer_name": "  Dash Customer  ",
        "email": "   ",
        "phone": "",
        "summary": "  Dashboard summary  ",
        "source": "dashboard"
      }'::jsonb) as res;
    `);
    expect(dashRes.rows[0].res.duplicate).toBe(false);

    const ticketId = dashRes.rows[0].res.id;
    const tCheck = await db.query<any>(`SELECT * FROM tickets WHERE id = '${ticketId}'`);
    expect(tCheck.rows[0].customer_name).toBe('Dash Customer');
    expect(tCheck.rows[0].email).toBeNull();
    expect(tCheck.rows[0].phone).toBeNull();
    expect(tCheck.rows[0].summary).toBe('Dashboard summary');

    // 2. Chat agent ticket without contact fails
    await expect(
      db.query(`
        SELECT create_ticket('{
          "customer_name": "Agent User",
          "summary": "Need help",
          "source": "chat_agent"
        }'::jsonb);
      `)
    ).rejects.toThrow(/At least one of email or phone is required/);

    // 3. Voice agent ticket with email succeeds
    const voiceRes = await db.query<any>(`
      SELECT create_ticket('{
        "customer_name": "Voice User",
        "email": "voice@example.com",
        "summary": "Voice call summary",
        "source": "voice_agent"
      }'::jsonb) as res;
    `);
    expect(voiceRes.rows[0].res.duplicate).toBe(false);
  });

  it('create_ticket deduplicates on dedupe_key', async () => {
    const payload = JSON.stringify({
      customer_name: 'Dedupe User',
      email: 'dedupe@example.com',
      summary: 'Dedupe summary test',
      source: 'chat_agent',
      dedupe_key: 'conv_123:delay:abc456',
    });

    const first = await db.query<any>(`SELECT create_ticket('${payload}'::jsonb) as res;`);
    expect(first.rows[0].res.duplicate).toBe(false);
    const firstTicketId = first.rows[0].res.ticket_id;

    const second = await db.query<any>(`SELECT create_ticket('${payload}'::jsonb) as res;`);
    expect(second.rows[0].res.duplicate).toBe(true);
    expect(second.rows[0].res.ticket_id).toBe(firstTicketId);
    expect(second.rows[0].res.id).toBe(first.rows[0].res.id);
  });

  it('creation trigger automatically inserts a system note', async () => {
    const res = await db.query<any>(`
      INSERT INTO tickets (customer_name, summary, source)
      VALUES ('Trigger User', 'Checking initial note trigger', 'chat_agent')
      RETURNING id;
    `);
    const tid = res.rows[0].id;

    const notes = await db.query<any>(`
      SELECT * FROM ticket_notes WHERE ticket_uuid = '${tid}';
    `);
    expect(notes.rows.length).toBe(1);
    expect(notes.rows[0].author).toBe('system');
    expect(notes.rows[0].kind).toBe('system');
    expect(notes.rows[0].body).toBe('Ticket created via chat_agent');
  });

  it('update_ticket writes status_change and assignment notes, sets and clears resolved_at', async () => {
    const t = await db.query<any>(`
      INSERT INTO tickets (customer_name, summary, status)
      VALUES ('Update Test', 'Testing update_ticket', 'new')
      RETURNING id;
    `);
    const tid = t.rows[0].id;

    // 1. Assign ticket and change status to in_progress
    await db.query(`
      SELECT update_ticket(
        '${tid}'::uuid,
        '{"status": "in_progress", "assigned_to": "Jordan Reed"}'::jsonb,
        'Manager'
      );
    `);

    let check = await db.query<any>(`SELECT * FROM tickets WHERE id = '${tid}';`);
    expect(check.rows[0].status).toBe('in_progress');
    expect(check.rows[0].assigned_to).toBe('Jordan Reed');
    expect(check.rows[0].resolved_at).toBeNull();

    let notes = await db.query<any>(`
      SELECT * FROM ticket_notes WHERE ticket_uuid = '${tid}' ORDER BY created_at ASC;
    `);
    // Note 0: initial created note
    // Note 1: status_change
    // Note 2: assignment
    expect(notes.rows.some(n => n.kind === 'status_change' && n.body === 'Status: new to in_progress')).toBe(true);
    expect(notes.rows.some(n => n.kind === 'assignment' && n.body === 'Assigned to Jordan Reed')).toBe(true);

    // 2. Resolve ticket -> sets resolved_at
    await db.query(`
      SELECT update_ticket(
        '${tid}'::uuid,
        '{"status": "resolved"}'::jsonb,
        'Jordan Reed'
      );
    `);

    check = await db.query<any>(`SELECT * FROM tickets WHERE id = '${tid}';`);
    expect(check.rows[0].status).toBe('resolved');
    expect(check.rows[0].resolved_at).not.toBeNull();

    // 3. Reopen ticket -> clears resolved_at
    await db.query(`
      SELECT update_ticket(
        '${tid}'::uuid,
        '{"status": "open", "assigned_to": null}'::jsonb,
        'Jordan Reed'
      );
    `);

    check = await db.query<any>(`SELECT * FROM tickets WHERE id = '${tid}';`);
    expect(check.rows[0].status).toBe('open');
    expect(check.rows[0].assigned_to).toBeNull();
    expect(check.rows[0].resolved_at).toBeNull();

    const unassignedNote = await db.query<any>(`
      SELECT * FROM ticket_notes WHERE ticket_uuid = '${tid}' AND body = 'Unassigned';
    `);
    expect(unassignedNote.rows.length).toBe(1);

    // 4. Invalid status throws
    await expect(
      db.query(`SELECT update_ticket('${tid}'::uuid, '{"status": "bogus"}'::jsonb);`)
    ).rejects.toThrow(/Invalid status/);
  });

  it('ticket_counts returns accurate KPI metrics', async () => {
    await db.exec(`
      -- New handoff ticket
      INSERT INTO tickets (customer_name, summary, status, is_handoff, priority)
      VALUES ('H1', 'New handoff normal', 'new', true, 'normal');

      -- New non-handoff ticket
      INSERT INTO tickets (customer_name, summary, status, is_handoff, priority)
      VALUES ('D1', 'New dash urgent', 'new', false, 'urgent');

      -- In progress handoff ticket
      INSERT INTO tickets (customer_name, summary, status, is_handoff, priority)
      VALUES ('H2', 'In progress ticket', 'in_progress', true, 'normal');

      -- Urgent open ticket
      INSERT INTO tickets (customer_name, summary, status, is_handoff, priority)
      VALUES ('H3', 'Urgent open ticket', 'open', false, 'urgent');

      -- Urgent resolved ticket (should NOT be counted in urgent_open)
      INSERT INTO tickets (customer_name, summary, status, is_handoff, priority)
      VALUES ('H4', 'Urgent resolved ticket', 'resolved', false, 'urgent');
    `);

    const res = await db.query<any>(`SELECT ticket_counts() as counts;`);
    const counts = res.rows[0].counts;

    expect(counts.total).toBe(5);
    expect(counts.new).toBe(2);
    expect(counts.handoff_new).toBe(1);
    expect(counts.in_progress).toBe(1);
    // urgent_open: D1 (new, urgent) and H3 (open, urgent). H4 is resolved so excluded.
    expect(counts.urgent_open).toBe(2);
  });

  it('deleting a ticket cascades its notes', async () => {
    const t = await db.query<any>(`
      INSERT INTO tickets (customer_name, summary) VALUES ('Cascade User', 'Cascade notes test') RETURNING id;
    `);
    const tid = t.rows[0].id;

    await db.query(`
      SELECT add_ticket_note('${tid}'::uuid, 'Author', 'note', 'User note 1');
    `);

    const notesBefore = await db.query(`SELECT * FROM ticket_notes WHERE ticket_uuid = '${tid}';`);
    expect(notesBefore.rows.length).toBe(2); // 1 trigger system note + 1 added note

    await db.query(`DELETE FROM tickets WHERE id = '${tid}';`);

    const notesAfter = await db.query(`SELECT * FROM ticket_notes WHERE ticket_uuid = '${tid}';`);
    expect(notesAfter.rows.length).toBe(0);
  });

  it('deleting an order sets ticket order_uuid to null', async () => {
    const o = await db.query<any>(`
      INSERT INTO orders (order_id) VALUES ('CKT-2026-999999') RETURNING id;
    `);
    const oid = o.rows[0].id;

    const t = await db.query<any>(`
      INSERT INTO tickets (customer_name, summary, order_id, order_uuid)
      VALUES ('Order Linked User', 'Linked to order', 'CKT-2026-999999', '${oid}')
      RETURNING id, order_uuid;
    `);
    const tid = t.rows[0].id;
    expect(t.rows[0].order_uuid).toBe(oid);

    await db.query(`DELETE FROM orders WHERE id = '${oid}';`);

    const tAfter = await db.query<any>(`SELECT order_uuid, order_id FROM tickets WHERE id = '${tid}';`);
    expect(tAfter.rows[0].order_uuid).toBeNull();
    expect(tAfter.rows[0].order_id).toBe('CKT-2026-999999');
  });

  it('runs the seed script supabase/seed_tickets.sql cleanly', async () => {
    const seedSql = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'seed_tickets.sql'),
      'utf8'
    );
    await db.exec(seedSql);

    const countRes = await db.query<any>(`SELECT count(*)::int as count FROM tickets;`);
    expect(countRes.rows[0].count).toBe(10);

    const handoffRes = await db.query<any>(`SELECT count(*)::int as count FROM tickets WHERE is_handoff = true;`);
    expect(handoffRes.rows[0].count).toBe(5);

    const urgentRes = await db.query<any>(`SELECT count(*)::int as count FROM tickets WHERE priority = 'urgent';`);
    expect(urgentRes.rows[0].count).toBe(2);

    const resolvedOrClosed = await db.query<any>(`SELECT count(*)::int as count FROM tickets WHERE status IN ('resolved', 'closed');`);
    expect(resolvedOrClosed.rows[0].count).toBe(3);

    const transcriptNotes = await db.query<any>(`SELECT count(*)::int as count FROM ticket_notes WHERE kind = 'transcript';`);
    expect(transcriptNotes.rows[0].count).toBeGreaterThanOrEqual(2);
  });
});

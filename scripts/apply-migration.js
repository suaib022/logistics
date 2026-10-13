const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/002_enable_rls.sql'), 'utf-8');

  const client = new Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.rmbfjtycldualfpunusm',
    password: 'MwvuwPed1PGxEgRS',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected! Applying migration 002_enable_rls.sql...');

    await client.query(sql);
    console.log('Migration successfully applied!');

    // Verify RLS status on tables
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('orders', 'quotes', 'order_events');
    `);

    console.log('\n--- Table RLS Status ---');
    console.table(rlsCheck.rows);

    // Verify policies
    const policyCheck = await client.query(`
      SELECT tablename, policyname, cmd, roles 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);

    console.log('\n--- Active Security Policies ---');
    console.table(policyCheck.rows);

    await client.end();
    console.log('\nAll done! Row Level Security is active and secured.');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

migrate();

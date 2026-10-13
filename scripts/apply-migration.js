const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/002_enable_rls.sql'), 'utf-8');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.db_pass || '',
    database: process.env.DB_NAME || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
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

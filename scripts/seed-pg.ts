import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
  
  const client = new Client({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log(`Successfully connected to region: ap-southeast-1`);
    
    const initSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '001_init.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'seed.sql'), 'utf-8');

    console.log('Executing 001_init.sql...');
    await client.query(initSql);
    
    console.log('Executing seed.sql...');
    await client.query(seedSql);

    console.log('Database seeded successfully!');
  } catch (err: any) {
    console.error(`Failed:`, err.message);
  } finally {
    await client.end();
  }
}

main();

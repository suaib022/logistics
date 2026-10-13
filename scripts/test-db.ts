import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Try to query the orders table
  const { data, error } = await supabase.from('orders').select('order_id').limit(1);
  
  if (error) {
    if (error.code === '42P01') {
      console.log('Connection successful, but tables are not created yet.');
      console.log('Please run the SQL scripts in 001_init.sql in the Supabase SQL Editor.');
    } else {
      console.error('Connection error:', error.message);
    }
  } else {
    console.log('Connection successful! Database is accessible.');
    console.log('Found records:', data);
  }
}

testConnection();

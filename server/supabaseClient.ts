
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});

// Test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) throw error;
    console.log('Successfully connected to Supabase database');
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return false;
  }
}

// Test the connection immediately
testConnection();

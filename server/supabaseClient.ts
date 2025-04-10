
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: { 
      'x-my-custom-header': 'my-app-name',
      // Add authorization headers to bypass RLS
      'Authorization': 'Bearer ' + supabaseAnonKey
    },
  },
});

// Test database connection with logging
export async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      console.error('Supabase connection test error:', error);
      throw error;
    }
    
    console.log('Successfully connected to Supabase database');
    
    // Test bookings table specifically
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .single();
      
    if (bookingsError) {
      console.error('Supabase bookings test error:', bookingsError);
      console.log('This might indicate an issue with bookings table permissions');
    } else {
      console.log('Successfully connected to bookings table');
    }
    
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
    return false;
  }
}

// Test the connection immediately
testConnection();

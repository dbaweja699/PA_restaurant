import { supabase } from './supabaseClient';

// Initialize database - connect to Supabase but don't add sample data
async function initDatabase() {
  try {
    console.log('Connecting to Supabase database...');
    
    // Test the connection to Supabase
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }
    
    console.log('Successfully connected to Supabase database');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
  }
}

// Export the initialization function
export default initDatabase;
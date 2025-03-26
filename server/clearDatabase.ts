import { db, pool } from './db';

/**
 * Clears all data from the database tables while keeping the structure intact
 */
async function clearDatabase() {
  try {
    console.log('Clearing all data from database tables...');
    
    await db.execute(`
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE calls CASCADE;
      TRUNCATE TABLE chats CASCADE;
      TRUNCATE TABLE reviews CASCADE;
      TRUNCATE TABLE orders CASCADE;
      TRUNCATE TABLE bookings CASCADE;
      TRUNCATE TABLE performance_metrics CASCADE;
      TRUNCATE TABLE activity_logs CASCADE;
      TRUNCATE TABLE social_media CASCADE;
      TRUNCATE TABLE dashboard_stats CASCADE;
    `);
    
    console.log('All database tables have been cleared successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear database:', error);
    process.exit(1);
  }
}

// Run the clear function
clearDatabase();
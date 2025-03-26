import { db, pool } from './db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads sample data from SQL file into the database
 */
async function loadSampleData() {
  try {
    console.log('Loading sample data into database...');
    
    // Read the SQL file content
    const sqlFile = path.join(process.cwd(), 'populate_sample_data.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL script
    await db.execute(sqlContent);
    
    console.log('Sample data has been loaded successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to load sample data:', error);
    process.exit(1);
  }
}

// Run the load function
loadSampleData();
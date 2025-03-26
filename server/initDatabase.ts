import { db } from './db';
import * as schema from '@shared/schema';

// Basic initialization function to create and populate tables
async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create demo user
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log('Creating demo user...');
      await db.insert(schema.users).values({
        username: 'demo',
        password: 'demo123',
        fullName: 'Demo User',
        role: 'manager'
      });
    }
    
    // Create some initial performance metrics
    const existingMetrics = await db.select().from(schema.performanceMetrics);
    
    if (existingMetrics.length === 0) {
      console.log('Creating initial performance metrics...');
      await db.insert(schema.performanceMetrics).values({
        date: new Date(),
        customerSatisfaction: 90,
        responseTime: 45,
        issueResolution: 85,
        handoffRate: 15,
        overallEfficiency: 87
      });
    }
    
    // Create some activity logs
    const existingLogs = await db.select().from(schema.activityLogs);
    
    if (existingLogs.length === 0) {
      console.log('Creating initial activity logs...');
      await db.insert(schema.activityLogs).values([
        {
          timestamp: new Date(),
          activityType: 'call',
          activityId: 1,
          summary: 'Handled customer call about lunch reservation',
          status: 'completed'
        },
        {
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          activityType: 'booking',
          activityId: 1,
          summary: 'Created dinner reservation for Smith party of 4',
          status: 'completed'
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          activityType: 'review',
          activityId: 1,
          summary: 'Responded to customer review from John D.',
          status: 'completed'
        }
      ]);
    }
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Export the initialization function
export default initDatabase;
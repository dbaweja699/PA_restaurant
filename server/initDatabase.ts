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
        username: 'manager',
        password: 'password123',
        fullName: 'Sam Wilson',
        role: 'Restaurant Manager',
        avatarUrl: null
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
    
    // Create sample calls
    const existingCalls = await db.select().from(schema.calls);
    
    if (existingCalls.length === 0) {
      console.log('Creating sample calls...');
      await db.insert(schema.calls).values({
        phoneNumber: "+1 (555) 123-4567",
        startTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        status: "active",
        topic: "Reservation Inquiry",
        summary: "AI is confirming dinner reservation for 4 people...",
        aiHandled: true,
        transferredToHuman: false
      });
    }
    
    // Create sample chats
    const existingChats = await db.select().from(schema.chats);
    
    if (existingChats.length === 0) {
      console.log('Creating sample chats...');
      await db.insert(schema.chats).values({
        customerName: "Sarah J.",
        startTime: new Date(Date.now() - 7 * 60 * 1000), // 7 minutes ago
        status: "active",
        topic: "Menu Inquiry",
        source: "website",
        summary: "AI is providing gluten-free menu options...",
        aiHandled: true,
        transferredToHuman: false
      });
    }
    
    // Create sample orders
    const existingOrders = await db.select().from(schema.orders);
    
    if (existingOrders.length === 0) {
      console.log('Creating sample orders...');
      await db.insert(schema.orders).values({
        customerName: "Michael T.",
        orderTime: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        status: "processing",
        type: "takeout",
        items: [{ name: "Pasta Carbonara", price: "$16.99", quantity: 1 }],
        total: "$16.99",
        aiProcessed: true
      });
    }
    
    // Create sample reviews
    const existingReviews = await db.select().from(schema.reviews);
    
    if (existingReviews.length === 0) {
      console.log('Creating sample reviews...');
      await db.insert(schema.reviews).values([
        {
          customerName: "James R.",
          rating: 5,
          comment: "Amazing food and even better service! The AI booking system was seamless.",
          source: "website",
          date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          status: "responded",
          aiResponse: "Thank you for your kind words! We're thrilled to hear you enjoyed your experience.",
          aiRespondedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
        },
        {
          customerName: "Lisa M.",
          rating: 4,
          comment: "The chat assistant helped me find the perfect wine pairing for my meal.",
          source: "google",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          status: "responded",
          aiResponse: "We're glad our assistant was helpful! Thank you for your feedback.",
          aiRespondedAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
        },
        {
          customerName: "Robert K.",
          rating: 3,
          comment: "Good experience, but had to wait a bit longer than expected for my order.",
          source: "yelp",
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: "new",
          aiResponse: null,
          aiRespondedAt: null
        }
      ]);
    }
    
    // Create sample bookings
    const existingBookings = await db.select().from(schema.bookings);
    
    if (existingBookings.length === 0) {
      console.log('Creating sample bookings...');
      await db.insert(schema.bookings).values([
        {
          customerName: "Andrea C.",
          bookingTime: new Date(new Date().setHours(12, 30, 0, 0)),
          partySize: 2,
          notes: "Window",
          status: "confirmed",
          aiProcessed: true,
          source: "website",
          specialOccasion: null
        },
        {
          customerName: "Thomas G.",
          bookingTime: new Date(new Date().setHours(13, 15, 0, 0)),
          partySize: 4,
          notes: "Birthday",
          status: "confirmed",
          aiProcessed: true,
          source: "phone",
          specialOccasion: null
        },
        {
          customerName: "Sarah & David",
          bookingTime: new Date(new Date().setHours(18, 45, 0, 0)),
          partySize: 2,
          notes: "Anniversary",
          status: "pending",
          specialOccasion: "Anniversary",
          aiProcessed: true,
          source: "website"
        },
        {
          customerName: "Business Group",
          bookingTime: new Date(new Date().setHours(19, 30, 0, 0)),
          partySize: 8,
          notes: "Private Room",
          status: "confirmed",
          aiProcessed: true,
          source: "phone",
          specialOccasion: null
        },
        {
          customerName: "Jessica W.",
          bookingTime: new Date(new Date().setHours(20, 15, 0, 0)),
          partySize: 3,
          notes: "No preferences",
          status: "confirmed",
          aiProcessed: true,
          source: "website",
          specialOccasion: null
        }
      ]);
    }
    
    // Create sample dashboard stats
    const existingDashboardStats = await db.select().from(schema.dashboardStats);
    
    if (existingDashboardStats.length === 0) {
      console.log('Creating sample dashboard stats...');
      await db.insert(schema.dashboardStats).values({
        date: new Date(),
        callsHandledToday: 47,
        activeChats: 8,
        todaysBookings: 24,
        ordersProcessed: 32,
        ordersTotalValue: "$1,254"
      });
    }
    
    // Create some activity logs
    const existingLogs = await db.select().from(schema.activityLogs);
    
    if (existingLogs.length === 0) {
      console.log('Creating initial activity logs...');
      
      const activityData = [];
      for (let i = 0; i < 15; i++) {
        const types = ["call", "chat", "order", "booking", "review"];
        const statuses = ["active", "completed", "pending"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        activityData.push({
          timestamp: new Date(Date.now() - i * 10 * 60 * 1000),
          activityType: randomType,
          activityId: i + 1,
          summary: `AI processed a ${randomType} interaction`,
          status: randomStatus
        });
      }
      
      await db.insert(schema.activityLogs).values(activityData);
    }
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Export the initialization function
export default initDatabase;
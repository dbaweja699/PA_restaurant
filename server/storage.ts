import {
  type User, type InsertUser, 
  type Call, type InsertCall,
  type Chat, type InsertChat, 
  type Review, type InsertReview,
  type Order, type InsertOrder,
  type Booking, type InsertBooking,
  type PerformanceMetrics, type InsertPerformanceMetrics,
  type ActivityLog, type InsertActivityLog,
  type SocialMedia, type InsertSocialMedia,
  type DashboardStats, type InsertDashboardStats
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Call operations
  getCalls(): Promise<Call[]>;
  getCallById(id: number): Promise<Call | undefined>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: number, call: Partial<InsertCall>): Promise<Call | undefined>;
  
  // Chat operations
  getChats(): Promise<Chat[]>;
  getChatById(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat | undefined>;
  
  // Review operations
  getReviews(): Promise<Review[]>;
  getReviewById(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Booking operations
  getBookings(): Promise<Booking[]>;
  getBookingById(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  
  // Performance metrics operations
  getPerformanceMetrics(): Promise<PerformanceMetrics[]>;
  getLatestPerformanceMetrics(): Promise<PerformanceMetrics | undefined>;
  createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  
  // Activity log operations
  getActivityLogs(): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Social media operations
  getSocialMedia(): Promise<SocialMedia[]>;
  getSocialMediaById(id: number): Promise<SocialMedia | undefined>;
  createSocialMedia(social: InsertSocialMedia): Promise<SocialMedia>;
  updateSocialMedia(id: number, social: Partial<InsertSocialMedia>): Promise<SocialMedia | undefined>;
  
  // Dashboard stats operations
  getDashboardStats(): Promise<DashboardStats | undefined>;
  updateDashboardStats(stats: Partial<InsertDashboardStats>): Promise<DashboardStats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private calls: Map<number, Call>;
  private chats: Map<number, Chat>;
  private reviews: Map<number, Review>;
  private orders: Map<number, Order>;
  private bookings: Map<number, Booking>;
  private performanceMetrics: Map<number, PerformanceMetrics>;
  private activityLogs: Map<number, ActivityLog>;
  private socialMedia: Map<number, SocialMedia>;
  private dashboardStats: DashboardStats | undefined;
  
  private userCurrentId: number;
  private callCurrentId: number;
  private chatCurrentId: number;
  private reviewCurrentId: number;
  private orderCurrentId: number;
  private bookingCurrentId: number;
  private performanceMetricsCurrentId: number;
  private activityLogCurrentId: number;
  private socialMediaCurrentId: number;
  private dashboardStatsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.calls = new Map();
    this.chats = new Map();
    this.reviews = new Map();
    this.orders = new Map();
    this.bookings = new Map();
    this.performanceMetrics = new Map();
    this.activityLogs = new Map();
    this.socialMedia = new Map();
    
    this.userCurrentId = 1;
    this.callCurrentId = 1;
    this.chatCurrentId = 1;
    this.reviewCurrentId = 1;
    this.orderCurrentId = 1;
    this.bookingCurrentId = 1;
    this.performanceMetricsCurrentId = 1;
    this.activityLogCurrentId = 1;
    this.socialMediaCurrentId = 1;
    this.dashboardStatsCurrentId = 1;
    
    // Initialize with some demo data
    this.initializeDemoData();
  }
  
  private initializeDemoData() {
    // Create a sample user
    this.createUser({
      username: "manager",
      password: "password123",
      fullName: "Sam Wilson",
      role: "Restaurant Manager",
      avatarUrl: ""
    });
    
    // Create sample dashboard stats
    this.dashboardStats = {
      id: this.dashboardStatsCurrentId++,
      date: new Date(),
      callsHandledToday: 47,
      activeChats: 8,
      todaysBookings: 24,
      ordersProcessed: 32,
      ordersTotalValue: "$1,254"
    };
    
    // Create sample performance metrics
    this.createPerformanceMetrics({
      date: new Date(),
      customerSatisfaction: 92,
      responseTime: 85,
      issueResolution: 87,
      handoffRate: 12,
      overallEfficiency: 89
    });
    
    // Create sample calls
    this.createCall({
      phoneNumber: "+1 (555) 123-4567",
      startTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      status: "active",
      topic: "Reservation Inquiry",
      summary: "AI is confirming dinner reservation for 4 people...",
      aiHandled: true,
      transferredToHuman: false
    });
    
    // Create sample chats
    this.createChat({
      customerName: "Sarah J.",
      startTime: new Date(Date.now() - 7 * 60 * 1000), // 7 minutes ago
      status: "active",
      topic: "Menu Inquiry",
      source: "website",
      summary: "AI is providing gluten-free menu options...",
      aiHandled: true,
      transferredToHuman: false
    });
    
    // Create sample orders
    this.createOrder({
      customerName: "Michael T.",
      orderTime: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      status: "processing",
      type: "takeout",
      items: [{ name: "Pasta Carbonara", price: "$16.99", quantity: 1 }],
      total: "$16.99",
      aiProcessed: true
    });
    
    // Create sample reviews
    this.createReview({
      customerName: "James R.",
      rating: 5,
      comment: "Amazing food and even better service! The AI booking system was seamless.",
      source: "website",
      date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      status: "responded",
      aiResponse: "Thank you for your kind words! We're thrilled to hear you enjoyed your experience.",
      aiRespondedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    });
    
    this.createReview({
      customerName: "Lisa M.",
      rating: 4,
      comment: "The chat assistant helped me find the perfect wine pairing for my meal.",
      source: "google",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: "responded",
      aiResponse: "We're glad our assistant was helpful! Thank you for your feedback.",
      aiRespondedAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
    });
    
    this.createReview({
      customerName: "Robert K.",
      rating: 3,
      comment: "Good experience, but had to wait a bit longer than expected for my order.",
      source: "yelp",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "new"
    });
    
    // Create sample bookings
    this.createBooking({
      customerName: "Andrea C.",
      bookingTime: new Date(new Date().setHours(12, 30, 0, 0)),
      partySize: 2,
      notes: "Window",
      status: "confirmed",
      aiProcessed: true,
      source: "website"
    });
    
    this.createBooking({
      customerName: "Thomas G.",
      bookingTime: new Date(new Date().setHours(13, 15, 0, 0)),
      partySize: 4,
      notes: "Birthday",
      status: "confirmed",
      aiProcessed: true,
      source: "phone"
    });
    
    this.createBooking({
      customerName: "Sarah & David",
      bookingTime: new Date(new Date().setHours(18, 45, 0, 0)),
      partySize: 2,
      notes: "Anniversary",
      status: "pending",
      specialOccasion: "Anniversary",
      aiProcessed: true,
      source: "website"
    });
    
    this.createBooking({
      customerName: "Business Group",
      bookingTime: new Date(new Date().setHours(19, 30, 0, 0)),
      partySize: 8,
      notes: "Private Room",
      status: "confirmed",
      aiProcessed: true,
      source: "phone"
    });
    
    this.createBooking({
      customerName: "Jessica W.",
      bookingTime: new Date(new Date().setHours(20, 15, 0, 0)),
      partySize: 3,
      notes: "No preferences",
      status: "confirmed",
      aiProcessed: true,
      source: "website"
    });
    
    // Create sample activity logs
    for (let i = 0; i < 15; i++) {
      const types = ["call", "chat", "order", "booking", "review"];
      const statuses = ["active", "completed", "pending"];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.createActivityLog({
        timestamp: new Date(Date.now() - i * 10 * 60 * 1000),
        activityType: randomType,
        activityId: i + 1,
        summary: `AI processed a ${randomType} interaction`,
        status: randomStatus
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'user',
      avatarUrl: insertUser.avatarUrl === undefined ? null : insertUser.avatarUrl
    };
    this.users.set(id, user);
    return user;
  }
  
  // Call methods
  async getCalls(): Promise<Call[]> {
    return Array.from(this.calls.values());
  }
  
  async getCallById(id: number): Promise<Call | undefined> {
    return this.calls.get(id);
  }
  
  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = this.callCurrentId++;
    const call: Call = { ...insertCall, id };
    this.calls.set(id, call);
    return call;
  }
  
  async updateCall(id: number, partialCall: Partial<InsertCall>): Promise<Call | undefined> {
    const existingCall = this.calls.get(id);
    if (!existingCall) return undefined;
    
    const updatedCall = { ...existingCall, ...partialCall };
    this.calls.set(id, updatedCall);
    return updatedCall;
  }
  
  // Chat methods
  async getChats(): Promise<Chat[]> {
    return Array.from(this.chats.values());
  }
  
  async getChatById(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.chatCurrentId++;
    const chat: Chat = { ...insertChat, id };
    this.chats.set(id, chat);
    return chat;
  }
  
  async updateChat(id: number, partialChat: Partial<InsertChat>): Promise<Chat | undefined> {
    const existingChat = this.chats.get(id);
    if (!existingChat) return undefined;
    
    const updatedChat = { ...existingChat, ...partialChat };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }
  
  // Review methods
  async getReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }
  
  async getReviewById(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewCurrentId++;
    const review: Review = { ...insertReview, id };
    this.reviews.set(id, review);
    return review;
  }
  
  async updateReview(id: number, partialReview: Partial<InsertReview>): Promise<Review | undefined> {
    const existingReview = this.reviews.get(id);
    if (!existingReview) return undefined;
    
    const updatedReview = { ...existingReview, ...partialReview };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const order: Order = { ...insertOrder, id };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrder(id: number, partialOrder: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder = { ...existingOrder, ...partialOrder };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Booking methods
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
  
  async getBookingById(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    const booking: Booking = { ...insertBooking, id };
    this.bookings.set(id, booking);
    return booking;
  }
  
  async updateBooking(id: number, partialBooking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const updatedBooking = { ...existingBooking, ...partialBooking };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  // Performance metrics methods
  async getPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    return Array.from(this.performanceMetrics.values());
  }
  
  async getLatestPerformanceMetrics(): Promise<PerformanceMetrics | undefined> {
    const metrics = Array.from(this.performanceMetrics.values());
    if (metrics.length === 0) return undefined;
    
    return metrics.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }
  
  async createPerformanceMetrics(insertMetrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const id = this.performanceMetricsCurrentId++;
    const metrics: PerformanceMetrics = { ...insertMetrics, id };
    this.performanceMetrics.set(id, metrics);
    return metrics;
  }
  
  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values());
  }
  
  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogCurrentId++;
    const log: ActivityLog = { ...insertLog, id };
    this.activityLogs.set(id, log);
    return log;
  }
  
  // Social media methods
  async getSocialMedia(): Promise<SocialMedia[]> {
    return Array.from(this.socialMedia.values());
  }
  
  async getSocialMediaById(id: number): Promise<SocialMedia | undefined> {
    return this.socialMedia.get(id);
  }
  
  async createSocialMedia(insertSocial: InsertSocialMedia): Promise<SocialMedia> {
    const id = this.socialMediaCurrentId++;
    const social: SocialMedia = { ...insertSocial, id };
    this.socialMedia.set(id, social);
    return social;
  }
  
  async updateSocialMedia(id: number, partialSocial: Partial<InsertSocialMedia>): Promise<SocialMedia | undefined> {
    const existingSocial = this.socialMedia.get(id);
    if (!existingSocial) return undefined;
    
    const updatedSocial = { ...existingSocial, ...partialSocial };
    this.socialMedia.set(id, updatedSocial);
    return updatedSocial;
  }
  
  // Dashboard stats methods
  async getDashboardStats(): Promise<DashboardStats | undefined> {
    return this.dashboardStats;
  }
  
  async updateDashboardStats(partialStats: Partial<InsertDashboardStats>): Promise<DashboardStats | undefined> {
    if (!this.dashboardStats) {
      const id = this.dashboardStatsCurrentId++;
      this.dashboardStats = {
        id,
        date: new Date(),
        callsHandledToday: 0,
        activeChats: 0,
        todaysBookings: 0,
        ordersProcessed: 0,
        ordersTotalValue: "$0"
      };
    }
    
    this.dashboardStats = { ...this.dashboardStats, ...partialStats };
    return this.dashboardStats;
  }
}

// Use the memory storage for now until we can get the project running
//import { storage as dbStorage } from './DatabaseStorage';
//export const storage = dbStorage;

export const storage = new MemStorage();

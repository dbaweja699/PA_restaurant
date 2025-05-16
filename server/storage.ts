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
  type DashboardStats, type InsertDashboardStats,
  type Notification, type InsertNotification,
  type Inventory, type InsertInventory,
  type Recipe, type InsertRecipe,
  type RecipeItem, type InsertRecipeItem
} from "../shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<{ username: string, email: string, full_name: string }>): Promise<User | undefined>;
  
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
  updatePerformanceMetrics(metrics: Partial<InsertPerformanceMetrics>): Promise<PerformanceMetrics | undefined>;
  
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
  
  // AI Agent Notification operations
  getNotifications(userId?: number): Promise<Notification[]>;
  getUnreadNotifications(userId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId?: number): Promise<void>;
  
  // Inventory Management operations
  getInventoryItems(): Promise<Inventory[]>;
  getInventoryItemById(id: number): Promise<Inventory | undefined>;
  getInventoryItemsByCategory(category: string): Promise<Inventory[]>;
  getLowStockItems(): Promise<Inventory[]>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  updateInventoryStock(id: number, quantityChange: number, unitPrice?: string, totalPrice?: string): Promise<Inventory | undefined>;
  
  // Recipe Management operations
  getRecipes(): Promise<Recipe[]>;
  getRecipeById(id: number): Promise<Recipe | undefined>;
  getRecipesByCategory(category: string): Promise<Recipe[]>;
  getRecipesByOrderType(orderType: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  
  // Recipe Items operations
  getRecipeItems(recipeId: number): Promise<RecipeItem[]>;
  getRecipeItemsWithDetails(recipeId: number): Promise<(RecipeItem & { inventoryItem: Inventory })[]>;
  createRecipeItem(item: InsertRecipeItem): Promise<RecipeItem>;
  updateRecipeItem(id: number, item: Partial<InsertRecipeItem>): Promise<RecipeItem | undefined>;
  deleteRecipeItem(id: number): Promise<void>;
  
  // Process order and update inventory
  processOrderInventory(dishName: string, orderType: string): Promise<{ success: boolean, lowStockItems: Inventory[] }>;
  
  // Photo Gallery operations
  getPhotoGallery(): Promise<PhotoGallery[]>;
  getPhotoById(id: number): Promise<PhotoGallery | undefined>;
  createPhoto(photo: InsertPhotoGallery): Promise<PhotoGallery>;
  updatePhoto(id: number, photo: Partial<InsertPhotoGallery>): Promise<PhotoGallery | undefined>;
  generateAICaption(id: number): Promise<string | undefined>;
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
  private notifications: Map<number, Notification>;
  private dashboardStats: DashboardStats | undefined;
  
  // Inventory management
  private inventory: Map<number, Inventory>;
  private recipes: Map<number, Recipe>;
  private recipeItems: Map<number, RecipeItem>;
  
  private userCurrentId: number;
  private callCurrentId: number;
  private chatCurrentId: number;
  private reviewCurrentId: number;
  private orderCurrentId: number;
  private bookingCurrentId: number;
  private performanceMetricsCurrentId: number;
  private activityLogCurrentId: number;
  private socialMediaCurrentId: number;
  private notificationCurrentId: number;
  private dashboardStatsCurrentId: number;
  private inventoryCurrentId: number;
  private recipeCurrentId: number;
  private recipeItemCurrentId: number;

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
    this.notifications = new Map();
    
    // Initialize inventory management maps
    this.inventory = new Map();
    this.recipes = new Map();
    this.recipeItems = new Map();
    
    this.userCurrentId = 1;
    this.callCurrentId = 1;
    this.chatCurrentId = 1;
    this.reviewCurrentId = 1;
    this.orderCurrentId = 1;
    this.bookingCurrentId = 1;
    this.performanceMetricsCurrentId = 1;
    this.activityLogCurrentId = 1;
    this.socialMediaCurrentId = 1;
    this.notificationCurrentId = 1;
    this.dashboardStatsCurrentId = 1;
    this.inventoryCurrentId = 1;
    this.recipeCurrentId = 1;
    this.recipeItemCurrentId = 1;
    
    // Initialize with some demo data
    this.initializeDemoData();
  }
  
  private initializeDemoData() {
    // Create sample users
    this.createUser({
      username: "manager",
      password: "password123",
      full_name: "Sam Wilson",
      role: "Restaurant Manager",
      avatar_url: ""
    });
    
    // Create admin user for easy testing
    this.createUser({
      username: "admin",
      password: "admin123",
      full_name: "Administrator",
      role: "admin",
      avatar_url: ""
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
    try {
      // Check if username already exists
      const existing = [...this.users.values()].find(
        user => user.username === insertUser.username
      );
      
      if (existing) {
        throw new Error("Username already exists");
      }
      
      const id = this.userCurrentId++;
      
      // Convert from snake_case (API/DB) to camelCase (frontend)
      const user: User = { 
        id,
        username: insertUser.username,
        password: insertUser.password,
        full_name: insertUser.full_name,
        role: insertUser.role || 'user',
        avatar_url: insertUser.avatar_url || null
      };
      
      console.log("Creating user in MemStorage:", user);
      this.users.set(id, user);
      return user;
    } catch (error) {
      console.error("Error creating user in MemStorage:", error);
      throw error;
    }
  }
  
  async updateUser(id: number, userData: Partial<{ username: string, email: string, full_name: string }>): Promise<User | undefined> {
    try {
      const existingUser = this.users.get(id);
      if (!existingUser) {
        console.log(`No user found with id ${id} to update`);
        return undefined;
      }

      // Update the user with the new data
      const updatedUser = { 
        ...existingUser,
        ...userData 
      };
      
      console.log("Updating user in MemStorage:", updatedUser);
      this.users.set(id, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Error updating user in MemStorage:", error);
      throw error;
    }
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
    const call: Call = {
      id,
      status: insertCall.status || 'pending',
      phoneNumber: insertCall.phoneNumber,
      startTime: insertCall.startTime || new Date(),
      endTime: insertCall.endTime || null,
      duration: insertCall.duration || null,
      topic: insertCall.topic || null,
      summary: insertCall.summary || null,
      aiHandled: insertCall.aiHandled || false,
      transferredToHuman: insertCall.transferredToHuman || false
    };
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
    const chat: Chat = {
      id,
      status: insertChat.status || 'pending',
      startTime: insertChat.startTime || new Date(),
      endTime: insertChat.endTime || null,
      topic: insertChat.topic || null,
      summary: insertChat.summary || null,
      aiHandled: insertChat.aiHandled || false,
      transferredToHuman: insertChat.transferredToHuman || false,
      customerName: insertChat.customerName || null,
      source: insertChat.source || 'website'
    };
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
    const review: Review = {
      id,
      date: insertReview.date || new Date(),
      status: insertReview.status || 'new',
      customerName: insertReview.customerName,
      source: insertReview.source || 'website',
      rating: insertReview.rating,
      comment: insertReview.comment,
      aiResponse: insertReview.aiResponse || null,
      aiRespondedAt: insertReview.aiRespondedAt || null
    };
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
    const order: Order = {
      id,
      type: insertOrder.type,
      status: insertOrder.status || 'pending',
      customerName: insertOrder.customerName,
      orderTime: insertOrder.orderTime || new Date(),
      items: insertOrder.items,
      total: insertOrder.total,
      aiProcessed: insertOrder.aiProcessed || false
    };
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
    const booking: Booking = {
      id,
      status: insertBooking.status || 'pending',
      customerName: insertBooking.customerName,
      source: insertBooking.source || 'website',
      aiProcessed: insertBooking.aiProcessed || false,
      bookingTime: insertBooking.bookingTime,
      partySize: insertBooking.partySize,
      notes: insertBooking.notes || null,
      specialOccasion: insertBooking.specialOccasion || null
    };
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
    const metrics: PerformanceMetrics = {
      id,
      date: insertMetrics.date || new Date(),
      customerSatisfaction: insertMetrics.customerSatisfaction || null,
      responseTime: insertMetrics.responseTime || null,
      issueResolution: insertMetrics.issueResolution || null,
      handoffRate: insertMetrics.handoffRate || null,
      overallEfficiency: insertMetrics.overallEfficiency || null
    };
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
    const log: ActivityLog = {
      id,
      status: insertLog.status,
      summary: insertLog.summary,
      timestamp: insertLog.timestamp || new Date(),
      activityType: insertLog.activityType,
      activityId: insertLog.activityId
    };
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
    const social: SocialMedia = {
      id,
      status: insertSocial.status || 'pending',
      aiResponse: insertSocial.aiResponse || null,
      aiRespondedAt: insertSocial.aiRespondedAt || null,
      platform: insertSocial.platform,
      postTime: insertSocial.postTime,
      content: insertSocial.content,
      author: insertSocial.author
    };
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
  
  // Notification methods
  async getNotifications(userId?: number): Promise<Notification[]> {
    const notifications = Array.from(this.notifications.values());
    
    if (userId) {
      // Return notifications for specific user, or those with null userId (broadcast)
      return notifications.filter(notification => 
        notification.userId === userId || notification.userId === null
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // Return all notifications
    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async getUnreadNotifications(userId?: number): Promise<Notification[]> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter(notification => !notification.isRead);
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationCurrentId++;
    const notification: Notification = {
      id,
      type: insertNotification.type,
      message: insertNotification.message,
      details: insertNotification.details,
      isRead: insertNotification.isRead || false,
      createdAt: insertNotification.createdAt || new Date(),
      userId: insertNotification.userId || null
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId?: number): Promise<void> {
    const notifications = await this.getNotifications(userId);
    
    notifications.forEach(notification => {
      if (userId) {
        // Only mark as read if it matches the userId or is a broadcast
        if (notification.userId === userId || notification.userId === null) {
          this.notifications.set(notification.id, { ...notification, isRead: true });
        }
      } else {
        // Mark all as read
        this.notifications.set(notification.id, { ...notification, isRead: true });
      }
    });
  }
}

// Import SupabaseStorage for data persistence
import { SupabaseStorage } from './supabaseStorage';

// Use SupabaseStorage as the only storage implementation
export const storage = new SupabaseStorage();

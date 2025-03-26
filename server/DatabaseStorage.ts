import { db } from './db';
import { IStorage } from './storage';
import { eq } from 'drizzle-orm';
import {
  users, type User, type InsertUser,
  calls, type Call, type InsertCall,
  chats, type Chat, type InsertChat,
  reviews, type Review, type InsertReview,
  orders, type Order, type InsertOrder,
  bookings, type Booking, type InsertBooking,
  performanceMetrics, type PerformanceMetrics, type InsertPerformanceMetrics,
  activityLogs, type ActivityLog, type InsertActivityLog,
  socialMedia, type SocialMedia, type InsertSocialMedia,
  dashboardStats, type DashboardStats, type InsertDashboardStats
} from "@shared/schema";
import { desc, asc } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Call operations
  async getCalls(): Promise<Call[]> {
    return db.select().from(calls).orderBy(desc(calls.startTime));
  }

  async getCallById(id: number): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call || undefined;
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db
      .insert(calls)
      .values(insertCall)
      .returning();
    return call;
  }

  async updateCall(id: number, call: Partial<InsertCall>): Promise<Call | undefined> {
    const [updated] = await db
      .update(calls)
      .set(call)
      .where(eq(calls.id, id))
      .returning();
    return updated || undefined;
  }

  // Chat operations
  async getChats(): Promise<Chat[]> {
    return db.select().from(chats).orderBy(desc(chats.startTime));
  }

  async getChatById(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(insertChat)
      .returning();
    return chat;
  }

  async updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat | undefined> {
    const [updated] = await db
      .update(chats)
      .set(chat)
      .where(eq(chats.id, id))
      .returning();
    return updated || undefined;
  }

  // Review operations
  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.date));
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined> {
    const [updated] = await db
      .update(reviews)
      .set(review)
      .where(eq(reviews.id, id))
      .returning();
    return updated || undefined;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.orderTime));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  // Booking operations
  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.bookingTime));
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  // Performance metrics operations
  async getPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    return db.select().from(performanceMetrics).orderBy(desc(performanceMetrics.date));
  }

  async getLatestPerformanceMetrics(): Promise<PerformanceMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(performanceMetrics)
      .orderBy(desc(performanceMetrics.date))
      .limit(1);
    return metrics || undefined;
  }

  async createPerformanceMetrics(insertMetrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const [metrics] = await db
      .insert(performanceMetrics)
      .values(insertMetrics)
      .returning();
    return metrics;
  }

  // Activity log operations
  async getActivityLogs(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  // Social media operations
  async getSocialMedia(): Promise<SocialMedia[]> {
    return db.select().from(socialMedia).orderBy(desc(socialMedia.postTime));
  }

  async getSocialMediaById(id: number): Promise<SocialMedia | undefined> {
    const [social] = await db.select().from(socialMedia).where(eq(socialMedia.id, id));
    return social || undefined;
  }

  async createSocialMedia(insertSocial: InsertSocialMedia): Promise<SocialMedia> {
    const [social] = await db
      .insert(socialMedia)
      .values(insertSocial)
      .returning();
    return social;
  }

  async updateSocialMedia(id: number, social: Partial<InsertSocialMedia>): Promise<SocialMedia | undefined> {
    const [updated] = await db
      .update(socialMedia)
      .set(social)
      .where(eq(socialMedia.id, id))
      .returning();
    return updated || undefined;
  }

  // Dashboard stats operations
  async getDashboardStats(): Promise<DashboardStats | undefined> {
    const [stats] = await db
      .select()
      .from(dashboardStats)
      .orderBy(desc(dashboardStats.date))
      .limit(1);
    return stats || undefined;
  }

  async updateDashboardStats(stats: Partial<InsertDashboardStats>): Promise<DashboardStats | undefined> {
    // Check if any dashboard stats exist
    const [existing] = await db.select({ id: dashboardStats.id }).from(dashboardStats).limit(1);

    if (existing) {
      // Update existing stats
      const [updated] = await db
        .update(dashboardStats)
        .set(stats)
        .where(eq(dashboardStats.id, existing.id))
        .returning();
      return updated || undefined;
    } else {
      // Create new stats
      const [newStats] = await db
        .insert(dashboardStats)
        .values(stats as InsertDashboardStats)
        .returning();
      return newStats;
    }
  }
}

export const storage = new DatabaseStorage();
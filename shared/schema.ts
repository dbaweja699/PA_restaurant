import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  avatarUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Call schema
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  status: text("status").notNull().default("active"),
  topic: text("topic"),
  summary: text("summary"),
  aiHandled: boolean("ai_handled").notNull().default(true),
  transferredToHuman: boolean("transferred_to_human").notNull().default(false),
});

export const insertCallSchema = createInsertSchema(calls).pick({
  phoneNumber: true,
  startTime: true,
  endTime: true,
  duration: true,
  status: true,
  topic: true,
  summary: true,
  aiHandled: true,
  transferredToHuman: true,
});

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;

// Chat schema
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("active"),
  topic: text("topic"),
  source: text("source").notNull().default("website"),
  summary: text("summary"),
  aiHandled: boolean("ai_handled").notNull().default(true),
  transferredToHuman: boolean("transferred_to_human").notNull().default(false),
});

export const insertChatSchema = createInsertSchema(chats).pick({
  customerName: true,
  startTime: true,
  endTime: true,
  status: true,
  topic: true,
  source: true,
  summary: true,
  aiHandled: true,
  transferredToHuman: true,
});

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

// Review schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  source: text("source").notNull().default("website"),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull().default("new"), // new, responded, archived
  aiResponse: text("ai_response"),
  aiRespondedAt: timestamp("ai_responded_at"),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  customerName: true,
  rating: true,
  comment: true,
  source: true,
  date: true,
  status: true,
  aiResponse: true,
  aiRespondedAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  orderTime: timestamp("order_time").notNull().defaultNow(),
  status: text("status").notNull().default("processing"),
  type: text("type").notNull(), // delivery, takeout, dine-in
  items: json("items").notNull(),
  total: text("total").notNull(),
  aiProcessed: boolean("ai_processed").notNull().default(true),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  customerName: true,
  orderTime: true,
  status: true,
  type: true,
  items: true,
  total: true,
  aiProcessed: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Booking schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  bookingTime: timestamp("booking_time").notNull(),
  partySize: integer("party_size").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("confirmed"),
  specialOccasion: text("special_occasion"),
  aiProcessed: boolean("ai_processed").notNull().default(true),
  source: text("source").notNull().default("website"),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  customerName: true,
  bookingTime: true,
  partySize: true,
  notes: true,
  status: true,
  specialOccasion: true,
  aiProcessed: true,
  source: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Performance metrics schema
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  customerSatisfaction: integer("customer_satisfaction"),
  responseTime: integer("response_time"),
  issueResolution: integer("issue_resolution"),
  handoffRate: integer("handoff_rate"),
  overallEfficiency: integer("overall_efficiency"),
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).pick({
  date: true,
  customerSatisfaction: true,
  responseTime: true,
  issueResolution: true,
  handoffRate: true,
  overallEfficiency: true,
});

export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;

// Activity log schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  activityType: text("activity_type").notNull(), // call, chat, order, booking, review
  activityId: integer("activity_id").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  timestamp: true,
  activityType: true,
  activityId: true,
  summary: true,
  status: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Social media schema
export const socialMedia = pgTable("social_media", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  postTime: timestamp("post_time").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  status: text("status").notNull().default("pending"),
  aiResponse: text("ai_response"),
  aiRespondedAt: timestamp("ai_responded_at"),
});

export const insertSocialMediaSchema = createInsertSchema(socialMedia).pick({
  platform: true,
  postTime: true,
  content: true,
  author: true,
  status: true,
  aiResponse: true,
  aiRespondedAt: true,
});

export type InsertSocialMedia = z.infer<typeof insertSocialMediaSchema>;
export type SocialMedia = typeof socialMedia.$inferSelect;

// Dashboard stats schema (for quick access to current stats)
export const dashboardStats = pgTable("dashboard_stats", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  callsHandledToday: integer("calls_handled_today").notNull().default(0),
  activeChats: integer("active_chats").notNull().default(0),
  todaysBookings: integer("todays_bookings").notNull().default(0),
  ordersProcessed: integer("orders_processed").notNull().default(0),
  ordersTotalValue: text("orders_total_value").notNull().default("0"),
});

export const insertDashboardStatsSchema = createInsertSchema(dashboardStats).pick({
  date: true,
  callsHandledToday: true,
  activeChats: true,
  todaysBookings: true,
  ordersProcessed: true,
  ordersTotalValue: true,
});

export type InsertDashboardStats = z.infer<typeof insertDashboardStatsSchema>;
export type DashboardStats = typeof dashboardStats.$inferSelect;

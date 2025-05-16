import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  full_name: text("full_name").notNull(), // Using snake_case for DB column
  role: text("role").notNull(),
  avatar_url: text("avatar_url"), // Using snake_case for DB column
});

// This schema is for API validation, the database columns use snake_case
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  full_name: z.string(),
  role: z.string(),
  avatar_url: z.string().optional().nullable(),
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
  callRecordingUrl: text("call_recording_url"),
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
  callRecordingUrl: true,
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
  postedResponse: text("posted_response"),  // The actual response that was posted
  responseType: text("response_type").default("ai_approved"), // manual or ai_approved
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
  postedResponse: true,
  responseType: true,
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
  tableNumber: text("table_number"), // Table number for dine-in orders
  items: json("items").notNull(),
  total: text("total").notNull(),
  aiProcessed: boolean("ai_processed").notNull().default(true),
  callId: integer("call_id"), // Reference to call ID for orders made via phone
});

export const insertOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  orderTime: z.string().optional(),
  status: z.string().optional().default("processing"),
  type: z.string().refine(
    (type) => type === "manual-dine-in" || type === "manual-takeout" || type === "manual-delivery" || type === "manual-Takeout",
    "Order type must be 'manual-dine-in', 'manual-takeout', or 'manual-delivery'"
  ),
  tableNumber: z.string().nullable().optional(),
  items: z.array(z.object({
    name: z.string(),
    price: z.string(),
    quantity: z.number()
  })),
  total: z.string(),
  aiProcessed: z.boolean().optional().default(false),
  callId: z.number().nullable().optional(),
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
  specialOccasion: text("special_occasion"),
  aiProcessed: boolean("ai_processed").notNull().default(true),
  source: text("source").notNull().default("website"),
  userId: integer("user_id"),
  callId: integer("call_id"),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  customerName: true,
  partySize: true,
  notes: true,
  specialOccasion: true,
  aiProcessed: true,
  source: true,
  userId: true,
  callId: true,
}).extend({
  // Override the bookingTime field to accept ISO string and convert to Date
  bookingTime: z.string().transform((str) => new Date(str)),
  // Include status for UI even though it's not in the database
  status: z.string().optional(),
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
  customerSatisfaction: true,
  responseTime: true,
  issueResolution: true,
  handoffRate: true,
  overallEfficiency: true,
}).extend({
  // Override the date field to accept ISO string and convert to Date
  date: z.string().transform((str) => new Date(str)).optional(),
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
  activityType: true,
  activityId: true,
  summary: true,
  status: true,
}).extend({
  // Override the timestamp field to accept ISO string and convert to Date
  timestamp: z.string().transform((str) => new Date(str)).optional(),
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Social media schema
export const socialMedia = pgTable("social_media", {
  id: serial("id").primaryKey(),
  platform: text("platform"),
  post_content: text("post_content"),
  interaction_count: integer("interaction_count"),
  engagement_rate: text("engagement_rate"),
  user_id: integer("user_id"),
  prompt: text("prompt"),
  image_file_name: text("image_file_name"),
  caption: text("caption"),
});

export const insertSocialMediaSchema = z.object({
  platform: z.string().nullable().optional(),
  post_content: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  // Status is needed for frontend logic but not stored in database
  status: z.string().optional(),
  // Convert ISO string to Date object
  postTime: z.string().transform((str) => new Date(str)).optional(),
  image_file_name: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
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
  callsHandledToday: true,
  activeChats: true,
  todaysBookings: true,
  ordersProcessed: true,
  ordersTotalValue: true,
}).extend({
  // Override the date field to accept ISO string and convert to Date
  date: z.string().transform((str) => new Date(str)).optional(),
});

export type InsertDashboardStats = z.infer<typeof insertDashboardStatsSchema>;
export type DashboardStats = typeof dashboardStats.$inferSelect;

// AI Agent Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // call, booking, review, conversation
  message: text("message").notNull(),
  details: json("data").notNull(), // JSON object with relevant details (renamed to 'data' to match Supabase table)
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id"), // Optional, can be for specific user or broadcast
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  type: true,
  message: true,
  details: true,
  isRead: true,
  userId: true,
}).extend({
  // Override to ensure we accept JSON objects for details
  details: z.record(z.any()),
  // Override created_at to accept ISO string
  createdAt: z.string().transform((str) => new Date(str)).optional(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Inventory Management schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  unitOfMeasurement: text("unit_of_measurement").notNull(), // e.g., kg, liter, piece
  boxOrPackageQty: integer("box_or_package_qty").notNull(),
  unitPrice: text("unit_price").notNull(),
  totalPrice: text("total_price").notNull(),
  idealQty: integer("ideal_qty").notNull(), // Safe stock level
  currentQty: integer("current_qty").notNull().default(0),
  shelfLifeDays: integer("shelf_life_days"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  category: text("category"), // e.g., dairy, produce, meat, packaging
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  itemName: true,
  unitOfMeasurement: true,
  boxOrPackageQty: true,
  unitPrice: true,
  totalPrice: true,
  idealQty: true,
  currentQty: true,
  shelfLifeDays: true,
  category: true,
}).extend({
  // Override lastUpdated to accept ISO string
  lastUpdated: z.string().transform((str) => new Date(str)).optional(),
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Recipe schema
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  dishName: text("dish_name").notNull(),
  orderType: text("order_type").notNull(), // dine_in or takeaway
  description: text("description"),
  sellingPrice: text("selling_price"),
  category: text("category"), // e.g., appetizer, main, dessert
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRecipeSchema = createInsertSchema(recipes).pick({
  dishName: true,
  orderType: true,
  description: true,
  sellingPrice: true,
  category: true,
  isActive: true,
}).extend({
  // Override timestamps to accept ISO strings
  createdAt: z.string().transform((str) => new Date(str)).optional(),
  updatedAt: z.string().transform((str) => new Date(str)).optional(),
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// RecipeItems junction table
export const recipeItems = pgTable("recipe_items", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  inventoryId: integer("inventory_id").notNull().references(() => inventory.id, { onDelete: 'cascade' }),
  quantityRequired: text("quantity_required").notNull(),
  unit: text("unit").notNull(),
});

export const insertRecipeItemSchema = createInsertSchema(recipeItems).pick({
  recipeId: true,
  inventoryId: true,
  quantityRequired: true,
  unit: true,
});

export type InsertRecipeItem = z.infer<typeof insertRecipeItemSchema>;
export type RecipeItem = typeof recipeItems.$inferSelect;

// Define relations
export const inventoryRelations = relations(inventory, ({ many }) => ({
  recipeItems: many(recipeItems),
}));

export const recipesRelations = relations(recipes, ({ many }) => ({
  recipeItems: many(recipeItems),
}));

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeItems.recipeId],
    references: [recipes.id],
  }),
  inventoryItem: one(inventory, {
    fields: [recipeItems.inventoryId],
    references: [inventory.id],
  }),
}));

// Photo Gallery schema
export const photoGallery = pgTable("photo_gallary", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  caption: text("caption"),
  imageUrl: text("image_url"),
  status: text("status"),
});

export const insertPhotoGallerySchema = createInsertSchema(photoGallery).omit({
  id: true,
  createdAt: true,
});

export type InsertPhotoGallery = z.infer<typeof insertPhotoGallerySchema>;
export type PhotoGallery = typeof photoGallery.$inferSelect;
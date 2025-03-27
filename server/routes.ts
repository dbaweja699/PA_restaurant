import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertCallSchema, insertChatSchema, insertReviewSchema, insertOrderSchema, insertBookingSchema, insertSocialMediaSchema } from "../shared/schema";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for RestaurantAI Assistant
  const apiPrefix = "/api";
  
  // Dashboard stats endpoint will be implemented below

  // Auth routes
  app.post(`${apiPrefix}/auth/signup`, async (req, res) => {
    try {
      const { username, password, full_name } = req.body;
      
      console.log("Received signup request:", { username, full_name });
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Username already exists:", username);
        return res.status(400).json({ error: "Username already exists" });
      }
      
      try {
        // Create new user with proper field names that match schema
        const user = await storage.createUser({
          username,
          password,
          full_name: full_name || 'New User',
          role: 'user',
          avatar_url: null
        });
        
        console.log("User created successfully:", user);
        res.status(201).json({ message: "User created successfully", user });
      } catch (err: any) {
        console.error('Database error creating user:', err);
        // Check for specific permission errors
        if (err.message && (err.message.includes('permission denied') || 
                           err.message.includes('Unable to create user in database'))) {
          return res.status(403).json({ 
            error: "Permission denied", 
            message: "This application is in read-only mode. The administrator needs to create your account in the database directly."
          });
        }
        res.status(500).json({ error: "Database error creating user" });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post(`${apiPrefix}/auth/signin`, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Trim username to handle any whitespace issues
      const trimmedUsername = username.trim();
      
      console.log(`Login attempt for user: ${trimmedUsername}`);
      
      // Verify user exists in our database
      let user = await storage.getUserByUsername(trimmedUsername);
      
      // If not found with trimmed username, try exact match
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user) {
        console.log(`Authentication failed: Username "${trimmedUsername}" not found in database`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Check if password matches 
      // In production, we would use bcrypt to compare hashed passwords
      if (user.password !== password) {
        console.log(`Authentication failed: Incorrect password for user "${trimmedUsername}"`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      console.log(`User "${username}" authenticated successfully:`, user);
      
      // For security, don't send the password back
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error signing in:', error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });

  // Dashboard stats with real-time counts
  app.get(`${apiPrefix}/dashboard/stats`, async (req, res) => {
    try {
      // Get stored stats
      const stats = await storage.getDashboardStats();
      
      // Get actual counts from tables
      const calls = await storage.getCalls();
      const chats = await storage.getChats();
      const reviews = await storage.getReviews();
      const orders = await storage.getOrders();
      const bookings = await storage.getBookings();
      
      // Calculate today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.bookingTime);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      }).length;
      
      // Calculate active chats (chats with status "active" or "pending")
      const activeChats = chats.filter(chat => 
        chat.status.toLowerCase() === "active" || 
        chat.status.toLowerCase() === "pending"
      ).length;
      
      // Calculate orders processed today
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderTime);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      
      const ordersProcessed = todayOrders.length;
      
      // Calculate total value of today's orders
      const ordersTotalValue = todayOrders.reduce((total, order) => {
        // Remove currency symbol and convert to number
        const value = parseFloat(order.total.replace(/[^0-9.-]+/g, ""));
        return total + (isNaN(value) ? 0 : value);
      }, 0).toFixed(2);
      
      // Calculate calls handled today
      const callsHandledToday = calls.filter(call => {
        const callDate = new Date(call.startTime);
        callDate.setHours(0, 0, 0, 0);
        return callDate.getTime() === today.getTime();
      }).length;
      
      // Update dashboard with real counts from database
      res.json({
        ...stats,
        totalCalls: calls.length,
        totalChats: chats.length,
        totalReviews: reviews.length,
        totalOrders: orders.length,
        totalBookings: bookings.length,
        callsHandledToday: callsHandledToday,
        activeChats: activeChats,
        todaysBookings: todayBookings,
        ordersProcessed: ordersProcessed,
        ordersTotalValue: `$${ordersTotalValue}`,
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: "Error fetching dashboard stats" });
    }
  });
  
  app.get(`${apiPrefix}/dashboard/performance`, async (req, res) => {
    try {
      const metrics = await storage.getLatestPerformanceMetrics();
      res.json(metrics || { 
        customerSatisfaction: 0,
        responseTime: 0,
        issueResolution: 0,
        handoffRate: 0,
        overallEfficiency: 0,
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: "Error fetching performance metrics" });
    }
  });
  
  app.get(`${apiPrefix}/dashboard/activity`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = await storage.getRecentActivityLogs(limit);
      res.json(logs || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ error: "Error fetching activity logs" });
    }
  });
  
  // Calls
  app.get(`${apiPrefix}/calls`, async (req, res) => {
    try {
      const calls = await storage.getCalls();
      res.json(calls || []);
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ error: "Error fetching calls" });
    }
  });
  
  app.get(`${apiPrefix}/calls/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const call = await storage.getCallById(id);
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }
    res.json(call);
  });
  
  app.post(`${apiPrefix}/calls`, async (req, res) => {
    try {
      const validatedData = insertCallSchema.parse(req.body);
      const call = await storage.createCall(validatedData);
      res.status(201).json(call);
    } catch (error) {
      res.status(400).json({ error: "Invalid call data" });
    }
  });
  
  app.patch(`${apiPrefix}/calls/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const call = await storage.getCallById(id);
      if (!call) {
        return res.status(404).json({ error: "Call not found" });
      }
      
      const validatedData = insertCallSchema.partial().parse(req.body);
      const updatedCall = await storage.updateCall(id, validatedData);
      res.json(updatedCall);
    } catch (error) {
      res.status(400).json({ error: "Invalid call data" });
    }
  });
  
  // Chats
  app.get(`${apiPrefix}/chats`, async (req, res) => {
    try {
      const chats = await storage.getChats();
      res.json(chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ error: "Error fetching chats" });
    }
  });
  
  app.get(`${apiPrefix}/chats/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const chat = await storage.getChatById(id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.json(chat);
  });
  
  app.post(`${apiPrefix}/chats`, async (req, res) => {
    try {
      const validatedData = insertChatSchema.parse(req.body);
      const chat = await storage.createChat(validatedData);
      res.status(201).json(chat);
    } catch (error) {
      res.status(400).json({ error: "Invalid chat data" });
    }
  });
  
  app.patch(`${apiPrefix}/chats/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chat = await storage.getChatById(id);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      const validatedData = insertChatSchema.partial().parse(req.body);
      const updatedChat = await storage.updateChat(id, validatedData);
      res.json(updatedChat);
    } catch (error) {
      res.status(400).json({ error: "Invalid chat data" });
    }
  });
  
  // Reviews
  app.get(`${apiPrefix}/reviews`, async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: "Error fetching reviews" });
    }
  });
  
  app.get(`${apiPrefix}/reviews/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const review = await storage.getReviewById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json(review);
  });
  
  app.post(`${apiPrefix}/reviews`, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ error: "Invalid review data" });
    }
  });
  
  app.patch(`${apiPrefix}/reviews/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.getReviewById(id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      const validatedData = insertReviewSchema.partial().parse(req.body);
      const updatedReview = await storage.updateReview(id, validatedData);
      res.json(updatedReview);
    } catch (error) {
      res.status(400).json({ error: "Invalid review data" });
    }
  });
  
  // Orders
  app.get(`${apiPrefix}/orders`, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: "Error fetching orders" });
    }
  });
  
  app.get(`${apiPrefix}/orders/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const order = await storage.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });
  
  app.post(`${apiPrefix}/orders`, async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });
  
  app.patch(`${apiPrefix}/orders/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, validatedData);
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });
  
  // Bookings
  app.get(`${apiPrefix}/bookings`, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: "Error fetching bookings" });
    }
  });
  
  app.get(`${apiPrefix}/bookings/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const booking = await storage.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  });
  
  app.post(`${apiPrefix}/bookings`, async (req, res) => {
    try {
      console.log('Attempting to create booking with data:', req.body);
      const validatedData = insertBookingSchema.parse(req.body);
      console.log('Validation passed, creating booking:', validatedData);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ error: "Invalid booking data", details: error.errors });
      }
      // If we get here, it's likely a permission error from Supabase
      if (error instanceof Error && error.message && 
          (error.message.includes('permission denied') || 
           error.message.includes('Unable to create'))) {
        return res.status(403).json({ 
          error: "Permission denied", 
          message: "This application is in read-only mode. The administrator needs to create bookings in the database directly."
        });
      }
      res.status(400).json({ error: "Invalid booking data" });
    }
  });
  
  app.patch(`${apiPrefix}/bookings/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      const validatedData = insertBookingSchema.partial().parse(req.body);
      const updatedBooking = await storage.updateBooking(id, validatedData);
      res.json(updatedBooking);
    } catch (error) {
      res.status(400).json({ error: "Invalid booking data" });
    }
  });
  
  // Social Media
  app.get(`${apiPrefix}/social`, async (req, res) => {
    try {
      // First try to get social media through storage layer
      const social = await storage.getSocialMedia();
      
      if (social && social.length > 0) {
        console.log('Successfully retrieved social media posts:', social.length);
        return res.json(social);
      }
      
      // If storage layer returns empty, try direct database query
      console.log('Storage layer returned empty results, trying direct query...');
      
      // Use the PostgreSQL connection pool already imported at the top
      const result = await pool.query('SELECT * FROM social_media ORDER BY post_time DESC');
      
      if (result.rows && result.rows.length > 0) {
        console.log('Direct query retrieved social media posts:', result.rows.length);
        return res.json(result.rows);
      }
      
      // If no social media posts exist
      console.log('No social media posts found in database');
      res.json([]);
    } catch (error) {
      console.error('Error fetching social media:', error);
      res.status(500).json({ error: "Error fetching social media" });
    }
  });
  
  app.get(`${apiPrefix}/social/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const social = await storage.getSocialMediaById(id);
    if (!social) {
      return res.status(404).json({ error: "Social media post not found" });
    }
    res.json(social);
  });
  
  app.post(`${apiPrefix}/social`, async (req, res) => {
    try {
      const validatedData = insertSocialMediaSchema.parse(req.body);
      const social = await storage.createSocialMedia(validatedData);
      res.status(201).json(social);
    } catch (error) {
      res.status(400).json({ error: "Invalid social media data" });
    }
  });
  
  app.patch(`${apiPrefix}/social/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const social = await storage.getSocialMediaById(id);
      if (!social) {
        return res.status(404).json({ error: "Social media post not found" });
      }
      
      const validatedData = insertSocialMediaSchema.partial().parse(req.body);
      const updatedSocial = await storage.updateSocialMedia(id, validatedData);
      res.json(updatedSocial);
    } catch (error) {
      res.status(400).json({ error: "Invalid social media data" });
    }
  });
  
  // User
  app.get(`${apiPrefix}/user`, async (req, res) => {
    try {
      // If user data is stored in the session, return that
      if (req.headers.authorization) {
        // Bearer token could contain user ID or username
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          // Try to get the user by ID first
          let user;
          try {
            const userId = parseInt(token);
            if (!isNaN(userId)) {
              user = await storage.getUser(userId);
            }
          } catch (err) {
            // Not a number, try as username
          }
          
          // If not found by ID, try by username
          if (!user) {
            user = await storage.getUserByUsername(token);
          }
          
          if (user) {
            return res.json(user);
          }
        }
      }
      
      // If no valid session found, return 401
      return res.status(401).json({ error: "Not authenticated" });
    
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Add endpoint to update user data
  app.patch(`${apiPrefix}/user`, async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.headers.authorization) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get user from token
      const token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Try to get the user by ID first
      let user;
      try {
        const userId = parseInt(token);
        if (!isNaN(userId)) {
          user = await storage.getUser(userId);
        }
      } catch (err) {
        // Not a number, try as username
      }
      
      // If not found by ID, try by username
      if (!user) {
        user = await storage.getUserByUsername(token);
      }
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Extract fields that are allowed to be updated
      const { username, email, full_name } = req.body;
      const updateData: Partial<{ username: string, email: string, full_name: string }> = {};

      // Only include fields that are provided and changed
      if (username && username !== user.username) {
        updateData.username = username;
      }

      if (email) {
        updateData.email = email; 
      }

      if (full_name && full_name !== user.full_name) {
        updateData.full_name = full_name;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No changes detected" });
      }

      // Update user in Supabase/database
      try {
        console.log('Updating user:', user.id, 'with data:', updateData);
        
        // Update in Supabase through storage layer
        // If your storage doesn't have updateUser, you'll need to modify IStorage and implement it
        if (storage.updateUser) {
          const updatedUser = await storage.updateUser(user.id, updateData);
          console.log('User updated successfully:', updatedUser);
          return res.json(updatedUser);
        } else {
          // Fallback if no updateUser method exists
          // This is a workaround and should be replaced with proper storage implementation
          return res.status(501).json({ 
            error: "Update not implemented",
            message: "The updateUser method is not implemented in the storage layer"
          });
        }
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: "Failed to update user" });
      }
    } catch (error) {
      console.error('Error processing user update:', error);
      res.status(500).json({ error: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

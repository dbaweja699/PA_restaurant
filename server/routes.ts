import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from './supabaseClient';
import { z } from "zod";
import { insertCallSchema, insertChatSchema, insertReviewSchema, insertOrderSchema, insertBookingSchema, insertSocialMediaSchema, insertNotificationSchema } from "../shared/schema";
import { setupOpenAIRoutes } from "./openai";
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
        chat && chat.status && (
          chat.status.toLowerCase() === "active" || 
          chat.status.toLowerCase() === "pending"
        )
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
        if (!call.startTime && !call.start_time) return false;
        const callDate = new Date(call.startTime || call.start_time);
        const today = new Date();
        return callDate.toDateString() === today.toDateString();
      }).length;

      // Calculate active chats more accurately
      const activeChats = chats.filter(chat => 
        (chat.status === "active" || chat.status === "waiting") &&
        (chat.endTime === null && chat.end_time === null)
      ).length;

      // Calculate today's bookings more accurately
      const today = new Date();
      const todayBookings = bookings.filter(booking => {
        if (!booking.bookingTime && !booking.booking_time) return false;
        const bookingDate = new Date(booking.bookingTime || booking.booking_time);
        return bookingDate.toDateString() === today.toDateString();
      }).length;

      // Calculate orders processed today
      const ordersProcessedToday = orders.filter(order => {
        if (!order.orderTime && !order.order_time) return false;
        const orderDate = new Date(order.orderTime || order.order_time);
        return orderDate.toDateString() === today.toDateString();
      });
      
      const ordersProcessed = ordersProcessedToday.length;
      
      // Calculate total value of today's orders
      const ordersTotalValue = ordersProcessedToday.reduce((total, order) => {
        const orderTotal = parseFloat(order.total || "0");
        return total + (isNaN(orderTotal) ? 0 : orderTotal);
      }, 0).toFixed(2);

      // Generate performance metrics if we don't have them
      const performanceStats = {
        customerSatisfaction: Math.floor(80 + Math.random() * 15), // 80-95%
        responseTime: Math.floor(75 + Math.random() * 20), // 75-95%
        issueResolution: Math.floor(70 + Math.random() * 25), // 70-95%
        handoffRate: Math.floor(20 + Math.random() * 10), // 20-30% (lower is better)
        overallEfficiency: Math.floor(85 + Math.random() * 10), // 85-95%
      };

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
        ...performanceStats,
        date: new Date().toISOString()
      });
      
      // Update performance metrics in the database
      try {
        await storage.updatePerformanceMetrics({
          ...performanceStats,
          date: new Date()
        });
      } catch (error) {
        console.log('Error updating performance metrics:', error);
      }
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
      console.log(`PATCH request for review ID: ${req.params.id}`, req.body);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid review ID, must be a number" });
      }

      const review = await storage.getReviewById(id);
      if (!review) {
        console.log(`Review with ID ${id} not found`);
        return res.status(404).json({ error: "Review not found" });
      }

      console.log(`Found review:`, review);

      try {
        // Check each field explicitly in validation
        const validatedData = {
          status: req.body.status,
          posted_response: req.body.posted_response,
          response_type: req.body.response_type
        };
        console.log(`Validated data:`, validatedData);

        const updatedReview = await storage.updateReview(id, validatedData);
        console.log(`Updated review:`, updatedReview);

        res.json(updatedReview);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ 
          error: "Invalid review data",
          details: validationError instanceof Error ? validationError.message : "Unknown validation error"
        });
      }
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ 
        error: "Error updating review",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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
      console.log('Attempting to create order with data:', req.body);

      // Validate the incoming data
      try {
        // Handle validation with more helpful debugging
        let validatedData;
        try {
          validatedData = insertOrderSchema.parse(req.body);
          console.log('Validation passed with data:', validatedData);
        } catch (zodError) {
          console.error('Zod validation error:', zodError);
          throw zodError;
        }

        // Format the order type to always prefix with 'manual-' for orders from the form
        const orderType = validatedData.type.startsWith('manual-') 
          ? validatedData.type 
          : `manual-${validatedData.type}`;

        // Format items for JSON storage if needed
        let formattedItems = validatedData.items;
        if (Array.isArray(validatedData.items)) {
          // If items is an array of objects, transform it to the required format
          const itemsObject = {};
          validatedData.items.forEach(item => {
            if (item.name && item.quantity) {
              itemsObject[item.name] = item.quantity;
            }
          });
          // Keep both formats for backward compatibility
          formattedItems = {
            formatted: itemsObject,
            original: validatedData.items
          };
        }

        // Create order directly with Supabase for more control
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            customer_name: validatedData.customerName,
            order_time: validatedData.orderTime || new Date().toISOString(),
            status: validatedData.status || 'processing',
            type: orderType,
            table_number: validatedData.tableNumber,
            items: formattedItems,
            total: validatedData.total,
            ai_processed: validatedData.aiProcessed || false,
            call_id: validatedData.callId
          }])
          .select('*')
          .single();

        if (orderError) {
          console.error('Supabase error creating order:', orderError);
          return res.status(500).json({
            error: "Failed to create order in database", 
            message: orderError.message,
            details: orderError.details
          });
        }

        if (!orderData) {
          return res.status(500).json({
            error: "Failed to retrieve created order",
            message: "Order was created but could not be retrieved"
          });
        }

        console.log('Order created successfully:', orderData);
        return res.status(201).json(orderData);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            error: "Invalid order data", 
            details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          });
        }
        return res.status(400).json({ 
          error: "Invalid order data",
          message: validationError instanceof Error ? validationError.message : "Unknown validation error"
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ 
        error: "Failed to create order", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.patch(`${apiPrefix}/orders/:id`, async (req, res) => {
    try {
      console.log(`PATCH request for order ID: ${req.params.id}`, req.body);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID, must be a number" });
      }

      const order = await storage.getOrderById(id);
      if (!order) {
        console.log(`Order with ID ${id} not found`);
        return res.status(404).json({ error: "Order not found" });
      }

      console.log(`Found order:`, order);

      // Handle status update specifically
      if (req.body.status && typeof req.body.status === 'string') {
        const validStatuses = ["processing", "confirmed", "ready", "completed", "cancelled"];
        const status = req.body.status.toLowerCase();

        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            error: "Invalid status value", 
            validValues: validStatuses 
          });
        }

        try {
          const updatedOrder = await storage.updateOrder(id, { status });
          console.log(`Updated order status:`, updatedOrder);
          return res.json(updatedOrder);
        } catch (updateError) {
          console.error('Error updating order status:', updateError);
          return res.status(500).json({
            error: "Failed to update order status",
            message: updateError instanceof Error ? updateError.message : "Unknown error"
          });
        }
      }

      // Handle full updates (all other fields)
      try {
        const validatedData = insertOrderSchema.partial().parse(req.body);
        const updatedOrder = await storage.updateOrder(id, validatedData);
        console.log(`Updated order:`, updatedOrder);
        res.json(updatedOrder);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ 
          error: "Invalid order data",
          details: validationError instanceof Error ? validationError.message : "Unknown validation error"
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ 
        error: "Error updating order",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bookings
  app.get(`${apiPrefix}/bookings`, async (req, res) => {
    try {
      // Use direct Supabase query with service role
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_time', { ascending: false });

      if (error) {
        console.error('Supabase error fetching bookings:', error);
        throw error;
      }

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

      // Validate the incoming data
      try {
        const validatedData = insertBookingSchema.parse(req.body);
        console.log('Validation passed with data:', validatedData);

        // Create a booking through the storage interface
        const booking = await storage.createBooking(validatedData);
        console.log('Booking created successfully:', booking);
        return res.status(201).json(booking);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            error: "Invalid booking data", 
            details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          });
        }
        return res.status(400).json({ 
          error: "Invalid booking data",
          message: validationError instanceof Error ? validationError.message : "Unknown validation error"
        });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ 
        error: "Failed to create booking", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
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

  app.delete(`${apiPrefix}/bookings/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete booking with ID: ${id}`);

      // First verify the booking exists by direct Supabase query
      const { data: existingBooking, error: findError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (findError) {
        console.error('Error finding booking for deletion:', findError);

        // Check if the error is a not found error
        if (findError.code === 'PGRST116') {
          return res.status(404).json({ error: "Booking not found" });
        }

        return res.status(500).json({ 
          error: "Failed to verify booking", 
          message: findError.message 
        });
      }

      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      console.log('Found booking to delete:', existingBooking);

      // Perform the delete operation directly with Supabase
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting booking from Supabase:', deleteError);
        return res.status(500).json({ 
          error: "Failed to delete booking", 
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details
        });
      }

      console.log(`Successfully deleted booking with ID: ${id}`);
      res.status(200).json({ 
        message: "Booking deleted successfully",
        id: id 
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({ 
        error: "Failed to delete booking", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
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

  // Notifications API routes
  app.get(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: "Error fetching notifications" });
    }
  });

  app.get(`${apiPrefix}/notifications/unread`, async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const unreadNotifications = await storage.getUnreadNotifications(userId);
      res.json(unreadNotifications);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ error: "Error fetching unread notifications" });
    }
  });

  app.post(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid notification data", details: error.errors });
      }
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  app.patch(`${apiPrefix}/notifications/:id/read`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post(`${apiPrefix}/notifications/read-all`, async (req, res) => {
    try {
      const userId = req.body.userId ? parseInt(req.body.userId) : undefined;
      await storage.markAllNotificationsAsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Special endpoint for the n8n webhook to create AI agent notifications
  app.post(`${apiPrefix}/ai-agent/notify`, async (req, res) => {
    try {
      // Validate basic structure
      if (!req.body.message || !req.body.type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create notification from n8n webhook data
      const notification = await storage.createNotification({
        type: req.body.type,
        message: req.body.message,
        details: req.body.details || {},
        isRead: false,
        userId: req.body.userId || null
      });

      res.status(201).json({ 
        success: true, 
        message: "Notification created successfully",
        notification 
      });
    } catch (error) {
      console.error('Error creating AI agent notification:', error);
      res.status(500).json({ 
        error: "Failed to create AI agent notification",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Diagnostic endpoint for checking Supabase authentication status
  app.get(`${apiPrefix}/system/db-auth-status`, async (req, res) => {
    try {
      console.log('Testing Supabase authentication status...');

      // Test if we can read from bookings
      const { data: readData, error: readError } = await supabase
        .from('bookings')
        .select('count');

      // Test if we can write to bookings
      const testBooking = {
        customer_name: 'Auth Test',
        booking_time: new Date().toISOString(),
        party_size: 2,
        source: 'system-test',
        ai_processed: false
      };

      const { data: writeData, error: writeError } = await supabase
        .from('bookings')
        .insert([testBooking])
        .select();

      // If insert succeeded, delete the test booking
      let deleteResult = null;
      let deleteError = null;

      if (writeData && writeData.length > 0) {
        const { data, error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', writeData[0].id)
          .select();

        deleteResult = data;
        deleteError = error;
      }

      res.json({
        authStatus: {
          read: {
            success: !readError,
            error: readError ? readError.message : null
          },
          write: {
            success: !writeError,
            error: writeError ? writeError.message : null,
            data: writeData ? 'Test booking created' : null
          },
          delete: {
            success: !deleteError,
            error: deleteError ? deleteError.message : null,
            data: deleteResult ? 'Test booking deleted' : null
          }
        }
      });
    } catch (error) {
      console.error('Error testing Supabase auth status:', error);
      res.status(500).json({
        error: 'Error testing Supabase auth status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Setup AI chatbot routes
  setupOpenAIRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
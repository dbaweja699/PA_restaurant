import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabaseClient";
import axios from "axios";
import { z } from "zod";
import {
  insertCallSchema,
  insertChatSchema,
  insertReviewSchema,
  insertOrderSchema,
  insertBookingSchema,
  insertSocialMediaSchema,
  insertNotificationSchema,
} from "../shared/schema";
import { setupOpenAIRoutes } from "./openai";
import { pool } from "./db";
import { registerInventoryRoutes } from "./inventory-routes";
import { registerPhotoGalleryRoutes } from "./photo-gallery-routes";
import * as dotenv from "dotenv";

dotenv.config();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for RestaurantAI Assistant
  const apiPrefix = "/api";

  // Register inventory routes
  registerInventoryRoutes(app);

  // Register photo gallery routes
  registerPhotoGalleryRoutes(app);

  // Dashboard stats endpoint will be implemented below

  // Proxy endpoint to N8N webhook
  app.post(`${apiPrefix}/proxy`, async (req, res) => {
    const EC2_HTTP_URL = process.env.N8N_WEBHOOK_URL! + "/call_agent";
    try {
      const response = await axios.post(EC2_HTTP_URL, req.body);
      res.json(response.data);
    } catch (error) {
      console.error("Error proxying to webhook:", error);
      res.status(500).json({ error: "Failed to connect to webhook service" });
    }
  });

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
          full_name: full_name || "New User",
          role: "user",
          avatar_url: null,
        });

        console.log("User created successfully:", user);
        res.status(201).json({ message: "User created successfully", user });
      } catch (err: any) {
        console.error("Database error creating user:", err);
        // Check for specific permission errors
        if (
          err.message &&
          (err.message.includes("permission denied") ||
            err.message.includes("Unable to create user in database"))
        ) {
          return res.status(403).json({
            error: "Permission denied",
            message:
              "This application is in read-only mode. The administrator needs to create your account in the database directly.",
          });
        }
        res.status(500).json({ error: "Database error creating user" });
      }
    } catch (error) {
      console.error("Error creating user:", error);
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
        console.log(
          `Authentication failed: Username "${trimmedUsername}" not found in database`,
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if password matches
      // In production, we would use bcrypt to compare hashed passwords
      if (user.password !== password) {
        console.log(
          `Authentication failed: Incorrect password for user "${trimmedUsername}"`,
        );
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log(`User "${username}" authenticated successfully:`, user);

      // For security, don't send the password back
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error signing in:", error);
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

      // Get current date for today's calculations
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate calls handled today
      const callsHandledToday = calls.filter((call) => {
        if (!call.startTime && !call.start_time) return false;
        const callDate = new Date(call.startTime || call.start_time);
        return callDate.toDateString() === today.toDateString();
      }).length;

      // Calculate active chats
      const activeChats = chats.filter(
        (chat) =>
          (chat.status === "active" ||
            chat.status === "waiting" ||
            (chat.status && chat.status.toLowerCase() === "pending")) &&
          chat.endTime === null &&
          chat.end_time === null,
      ).length;

      // Calculate today's bookings
      const todayBookings = bookings.filter((booking) => {
        if (!booking.bookingTime && !booking.booking_time) return false;
        const bookingDate = new Date(
          booking.bookingTime || booking.booking_time,
        );
        return bookingDate.toDateString() === today.toDateString();
      }).length;

      // Calculate orders processed today
      const ordersProcessedToday = orders.filter((order) => {
        if (!order.orderTime && !order.order_time) return false;
        const orderDate = new Date(order.orderTime || order.order_time);
        return orderDate.toDateString() === today.toDateString();
      });

      const ordersProcessed = ordersProcessedToday.length;

      // Calculate total value of today's orders
      const ordersTotalValue = ordersProcessedToday
        .reduce((total, order) => {
          const orderTotal = parseFloat(order.total || "0");
          return total + (isNaN(orderTotal) ? 0 : orderTotal);
        }, 0)
        .toFixed(2);

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
        date: new Date().toISOString(),
      });

      // Update performance metrics in the database
      try {
        await storage.updatePerformanceMetrics({
          ...performanceStats,
          date: new Date(),
        });
      } catch (error) {
        console.log("Error updating performance metrics:", error);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Error fetching dashboard stats" });
    }
  });

  app.get(`${apiPrefix}/dashboard/performance`, async (req, res) => {
    try {
      const metrics = await storage.getLatestPerformanceMetrics();
      res.json(
        metrics || {
          customerSatisfaction: 0,
          responseTime: 0,
          issueResolution: 0,
          handoffRate: 0,
          overallEfficiency: 0,
          date: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: "Error fetching performance metrics" });
    }
  });

  app.get(`${apiPrefix}/dashboard/activity`, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = await storage.getRecentActivityLogs(limit);
      res.json(logs || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Error fetching activity logs" });
    }
  });

  // Calls
  app.get(`${apiPrefix}/calls`, async (req, res) => {
    try {
      const calls = await storage.getCalls();
      res.json(calls || []);
    } catch (error) {
      console.error("Error fetching calls:", error);
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

      // Create notification for new call
      try {
        await storage.createNotification({
          type: "call",
          message: `New call from ${validatedData.phoneNumber || "Unknown"}`,
          details: {
            callId: call.id,
            phoneNumber: call.phoneNumber || call.phone_number,
            startTime: call.startTime || call.start_time,
            callType: call.type,
          },
          isRead: false,
          userId: null, // Notify all users
        });
      } catch (notificationError) {
        console.error(
          "Failed to create notification for new call:",
          notificationError,
        );
      }

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
      console.error("Error fetching chats:", error);
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
      console.error("Error fetching reviews:", error);
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

      // Create notification for new review
      try {
        const rating = review.rating || 0;
        const ratingText = "★".repeat(rating) + "☆".repeat(5 - rating);

        await storage.createNotification({
          type: "review",
          message: `New ${rating}-star review from ${review.customerName || review.customer_name}`,
          details: {
            reviewId: review.id,
            customerName: review.customerName || review.customer_name,
            rating: review.rating,
            comment: review.comment,
            source: review.source,
          },
          isRead: false,
          userId: null, // Notify all users
        });
      } catch (notificationError) {
        console.error(
          "Failed to create notification for new review:",
          notificationError,
        );
      }

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
        return res
          .status(400)
          .json({ error: "Invalid review ID, must be a number" });
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
          response_type: req.body.response_type,
        };
        console.log(`Validated data:`, validatedData);

        const updatedReview = await storage.updateReview(id, validatedData);
        console.log(`Updated review:`, updatedReview);

        res.json(updatedReview);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({
          error: "Invalid review data",
          details:
            validationError instanceof Error
              ? validationError.message
              : "Unknown validation error",
        });
      }
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({
        error: "Error updating review",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Orders
  app.get(`${apiPrefix}/orders`, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
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
      console.log("Attempting to create order with data:", req.body);

      // Validate the incoming data
      try {
        // Handle validation with more helpful debugging
        let validatedData;
        try {
          validatedData = insertOrderSchema.parse(req.body);
          console.log("Validation passed with data:", validatedData);
        } catch (zodError) {
          console.error("Zod validation error:", zodError);
          throw zodError;
        }

        // Format the order type to always prefix with 'manual-' for orders from the form
        const orderType = validatedData.type.startsWith("manual-")
          ? validatedData.type
          : `manual-${validatedData.type}`;

        // Format items for JSON storage if needed
        let formattedItems = validatedData.items;
        if (Array.isArray(validatedData.items)) {
          // If items is an array of objects, transform it to the required format
          const itemsObject = {};
          validatedData.items.forEach((item) => {
            if (item.name && item.quantity) {
              itemsObject[item.name] = item.quantity;
            }
          });
          // Keep both formats for backward compatibility
          formattedItems = {
            formatted: itemsObject,
            original: validatedData.items,
          };
        }

        // Create order directly with Supabase for more control
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              customer_name: validatedData.customerName,
              order_time: validatedData.orderTime || new Date().toISOString(),
              status: validatedData.status || "processing",
              type: orderType,
              table_number: validatedData.tableNumber,
              items: formattedItems,
              total: validatedData.total,
              ai_processed: validatedData.aiProcessed || false,
              call_id: validatedData.callId,
            },
          ])
          .select("*")
          .single();

        if (orderError) {
          console.error("Supabase error creating order:", orderError);
          return res.status(500).json({
            error: "Failed to create order in database",
            message: orderError.message,
            details: orderError.details,
          });
        }

        if (!orderData) {
          return res.status(500).json({
            error: "Failed to retrieve created order",
            message: "Order was created but could not be retrieved",
          });
        }

        console.log("Order created successfully:", orderData);

        // Create notification for new order
        try {
          await storage.createNotification({
            type: "order",
            message: `New order: ${orderData.customer_name} - $${orderData.total}`,
            details: {
              orderId: orderData.id,
              orderTime: orderData.order_time,
              customerName: orderData.customer_name,
              total: orderData.total,
              status: orderData.status,
            },
            isRead: false,
            userId: null, // Notify all users
          });
        } catch (notificationError) {
          console.error(
            "Failed to create notification for new order:",
            notificationError,
          );
        }

        return res.status(201).json(orderData);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({
            error: "Invalid order data",
            details: validationError.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          });
        }
        return res.status(400).json({
          error: "Invalid order data",
          message:
            validationError instanceof Error
              ? validationError.message
              : "Unknown validation error",
        });
      }
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.patch(`${apiPrefix}/orders/:id`, async (req, res) => {
    try {
      console.log(`PATCH request for order ID: ${req.params.id}`, req.body);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res
          .status(400)
          .json({ error: "Invalid order ID, must be a number" });
      }

      const order = await storage.getOrderById(id);
      if (!order) {
        console.log(`Order with ID ${id} not found`);
        return res.status(404).json({ error: "Order not found" });
      }

      console.log(`Found order:`, order);

      // Handle status update specifically
      if (req.body.status && typeof req.body.status === "string") {
        const validStatuses = [
          "processing",
          "confirmed",
          "ready",
          "completed",
          "cancelled",
        ];
        const status = req.body.status.toLowerCase();

        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: "Invalid status value",
            validValues: validStatuses,
          });
        }

        try {
          const updatedOrder = await storage.updateOrder(id, { status });
          console.log(`Updated order status:`, updatedOrder);
          return res.json(updatedOrder);
        } catch (updateError) {
          console.error("Error updating order status:", updateError);
          return res.status(500).json({
            error: "Failed to update order status",
            message:
              updateError instanceof Error
                ? updateError.message
                : "Unknown error",
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
        console.error("Validation error:", validationError);
        return res.status(400).json({
          error: "Invalid order data",

          details:
            validationError instanceof Error
              ? validationError.message
              : "Unknown validation error",
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        error: "Error updating order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Bookings
  app.get(`${apiPrefix}/bookings`, async (req, res) => {
    try {
      // Use direct Supabase query with service role
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .order("booking_time", { ascending: false });

      if (error) {
        console.error("Supabase error fetching bookings:", error);
        throw error;
      }

      res.json(bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
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
      console.log("Attempting to create booking with data:", req.body);

      // Validate the incoming data
      try {
        const validatedData = insertBookingSchema.parse(req.body);
        console.log("Validation passed with data:", validatedData);

        // Create a booking through the storage interface
        const booking = await storage.createBooking(validatedData);
        console.log("Booking created successfully:", booking);

        // Create notification for new booking
        try {
          await storage.createNotification({
            type: "booking",
            message: `New booking: ${validatedData.customerName} for ${validatedData.partySize} people`,
            details: {
              bookingId: booking.id,
              bookingTime: booking.bookingTime || booking.booking_time,
              customerName: booking.customerName || booking.customer_name,
              partySize: booking.partySize || booking.party_size,
            },
            isRead: false,
            userId: null, // Notify all users
          });
        } catch (notificationError) {
          console.error(
            "Failed to create notification for new booking:",
            notificationError,
          );
        }

        return res.status(201).json(booking);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({
            error: "Invalid booking data",
            details: validationError.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          });
        }
        return res.status(400).json({
          error: "Invalid booking data",
          message:
            validationError instanceof Error
              ? validationError.message
              : "Unknown validation error",
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({
        error: "Failed to create booking",
        message: error instanceof Error ? error.message : "Unknown error",
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
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (findError) {
        console.error("Error finding booking for deletion:", findError);

        // Check if the error is a not found error
        if (findError.code === "PGRST116") {
          return res.status(404).json({ error: "Booking not found" });
        }

        return res.status(500).json({
          error: "Failed to verify booking",
          message: findError.message,
        });
      }

      if (!existingBooking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      console.log("Found booking to delete:", existingBooking);

      // Perform the delete operation directly with Supabase
      const { error: deleteError } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting booking from Supabase:", deleteError);
        return res.status(500).json({
          error: "Failed to delete booking",
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
        });
      }

      console.log(`Successfully deleted booking with ID: ${id}`);
      res.status(200).json({
        message: "Booking deleted successfully",
        id: id,
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({
        error: "Failed to delete booking",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Social Media
  app.get(`${apiPrefix}/social`, async (req, res) => {
    try {
      // First try to get social media through storage layer
      const social = await storage.getSocialMedia();

      if (social && social.length > 0) {
        console.log(
          "Successfully retrieved social media posts:",
          social.length,
        );
        return res.json(social);
      }

      // If storage layer returns empty, try direct database query
      console.log(
        "Storage layer returned empty results, trying direct query...",
      );

      // Use the PostgreSQL connection pool already imported at the top
      const result = await pool.query(
        "SELECT * FROM social_media ORDER BY post_time DESC",
      );

      if (result.rows && result.rows.length > 0) {
        console.log(
          "Direct query retrieved social media posts:",
          result.rows.length,
        );
        return res.json(result.rows);
      }

      // If no social media posts exist
      console.log("No social media posts found in database");
      res.json([]);
    } catch (error) {
      console.error("Error fetching social media:", error);
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

  // Proxy endpoint for the social media webhook
  app.post(`${apiPrefix}/proxy/socialmedia`, async (req, res) => {
    try {
      console.log("Proxying request to social media webhook:", req.body);

      const response = await fetch(
        process.env.N8N_WEBHOOK_URL! + "/PA_content_flow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        },
      );

      if (!response.ok) {
        console.error(
          "Error from n8n webhook:",
          response.status,
          response.statusText,
        );
        return res.status(response.status).json({
          error: `Webhook responded with status ${response.status}`,
        });
      }

      const data = await response.json();
      console.log("Webhook response:", data);
      res.json(data);
    } catch (error) {
      console.error("Error proxying to webhook:", error);
      res.status(500).json({ error: "Failed to connect to webhook service" });
    }
  });

  // Proxy a request to the n8n webhook for social media interactions
  app.post("/api/proxy/socialmedia", async (req: Request, res: Response) => {
    try {
      // Get the webhook URL from environment variables
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

      if (!n8nWebhookUrl) {
        return res.status(500).json({ error: "Webhook URL not configured" });
      }

      // Forward the request to n8n
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      // Return the n8n response
      const data = await n8nResponse.json();
      res.status(n8nResponse.status).json(data);
    } catch (error) {
      console.error("Error proxying to n8n webhook:", error);
      res.status(500).json({ error: "Failed to process webhook request" });
    }
  });

  // Proxy a request to the n8n webhook for gallery image uploads
  app.post("/api/proxy/pa_gallery", async (req: Request, res: Response) => {
    try {
      // Get the webhook URL from environment variables
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

      if (!n8nWebhookUrl) {
        return res.status(500).json({ error: "Webhook URL not configured" });
      }

      // Build the full webhook URL with the /pa_gallery endpoint
      const galleryWebhookUrl = `${n8nWebhookUrl}/pa_gallery`;

      // Forward the request to n8n
      const n8nResponse = await fetch(galleryWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      // Return the n8n response
      const data = await n8nResponse.json();
      res.status(n8nResponse.status).json(data);
    } catch (error) {
      console.error("Error proxying to n8n gallery webhook:", error);
      res
        .status(500)
        .json({ error: "Failed to process gallery upload request" });
    }
  });

  // Service Request Proxy Endpoint
  app.post(`${apiPrefix}/proxy/service-request`, async (req, res) => {
    try {
      console.log("Proxying service request to n8n webhook:", req.body);

      if (!process.env.N8N_WEBHOOK_URL) {
        console.error("N8N_WEBHOOK_URL environment variable is not defined");
        return res.status(500).json({ error: "Webhook URL is not configured" });
      }

      const n8nWebhookUrl = `${process.env.N8N_WEBHOOK_URL}/request_service`;

      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        console.error(
          "Error from service request webhook:",
          response.status,
          response.statusText,
        );
        return res.status(response.status).json({
          error: `Webhook responded with status ${response.status}`,
        });
      }

      const data = await response.json();
      console.log("Service request webhook response:", data);
      res.json(data);
    } catch (error) {
      console.error("Error proxying to service request webhook:", error);
      res.status(500).json({ error: "Failed to connect to webhook service" });
    }
  });

  // Function Bookings API Endpoints
  app.get(`${apiPrefix}/function-bookings`, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("function_bookings")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching function bookings:", error);
        return res
          .status(500)
          .json({ error: "Failed to fetch function bookings" });
      }

      res.json(data || []);
    } catch (error) {
      console.error("Error fetching function bookings:", error);
      res.status(500).json({ error: "Error fetching function bookings" });
    }
  });

  app.get(`${apiPrefix}/function-bookings/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { data, error } = await supabase
        .from("function_bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching function booking:", error);
        return res.status(404).json({ error: "Function booking not found" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching function booking:", error);
      res.status(500).json({ error: "Error fetching function booking" });
    }
  });

  app.post(`${apiPrefix}/function-bookings`, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("function_bookings")
        .insert([req.body])
        .select()
        .single();

      if (error) {
        console.error("Error creating function booking:", error);
        return res
          .status(400)
          .json({ error: "Failed to create function booking" });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating function booking:", error);
      res.status(500).json({ error: "Error creating function booking" });
    }
  });

  app.patch(`${apiPrefix}/function-bookings/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { data, error } = await supabase
        .from("function_bookings")
        .update(req.body)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating function booking:", error);
        return res
          .status(400)
          .json({ error: "Failed to update function booking" });
      }

      res.json(data);
    } catch (error) {
      console.error("Error updating function booking:", error);
      res.status(500).json({ error: "Error updating function booking" });
    }
  });

  // Proxy endpoint for order webhook notifications
  app.post(`${apiPrefix}/proxy/order-webhook`, async (req, res) => {
    try {
      console.log("Proxying order to webhook:", req.body);

      if (!process.env.N8N_WEBHOOK_URL!) {
        console.error("N8N_WEBHOOK_URL environment variable is not defined");
        return res.status(500).json({ error: "Webhook URL is not configured" });
      }

      const response = await fetch(
        process.env.N8N_WEBHOOK_URL! + "/order_made",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        },
      );

      if (!response.ok) {
        console.error(
          "Error from order webhook:",
          response.status,
          response.statusText,
        );
        return res.status(response.status).json({
          error: `Order webhook responded with status ${response.status}`,
        });
      }

      const data = await response.json();
      console.log("Order webhook response:", data);
      res.json(data);
    } catch (error) {
      console.error("Error proxying to order webhook:", error);
      res
        .status(500)
        .json({ error: "Failed to connect to order webhook service" });
    }
  });

  // Proxy endpoint for AI voice agent functionality
  app.post(`${apiPrefix}/proxy/ai_voice`, async (req, res) => {
    const ELEVENLABS_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL! + "/call_agent";

    try {
      // Send the request as-is to the webhook URL
      const response = await axios.post(ELEVENLABS_WEBHOOK_URL, req.body, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      });

      // Return the response from the webhook
      res.json(response.data);
    } catch (error) {
      // Log the detailed error
      console.error("Error proxying to AI voice webhook:", error);

      // Handle axios errors specifically
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        console.error("Axios error details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
        });
      }

      // Send a clear error response
      res.status(500).json({
        error: "Failed to connect to AI voice webhook service",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // User
  app.get(`${apiPrefix}/user`, async (req, res) => {
    try {
      // If user data is stored in the session, return that
      if (req.headers.authorization) {
        // Bearer token could contain user ID or username
        const token = req.headers.authorization.split(" ")[1];
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
      const token = req.headers.authorization.split(" ")[1];
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
      const updateData: Partial<{
        username: string;
        email: string;
        full_name: string;
      }> = {};

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
        console.log("Updating user:", user.id, "with data:", updateData);

        // Update in Supabase through storage layer
        // If your storage doesn't have updateUser, you'll need to modify IStorage and implement it
        if (storage.updateUser) {
          const updatedUser = await storage.updateUser(user.id, updateData);
          console.log("User updated successfully:", updatedUser);
          return res.json(updatedUser);
        } else {
          // Fallback if no updateUser method exists
          // This is a workaround and should be replaced with proper storage implementation
          return res.status(501).json({
            error: "Update not implemented",
            message:
              "The updateUser method is not implemented in the storage layer",
          });
        }
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Failed to update user" });
      }
    } catch (error) {
      console.error("Error processing user update:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Notifications API routes
  app.get(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Error fetching notifications" });
    }
  });

  app.get(`${apiPrefix}/notifications/unread`, async (req, res) => {
    try {
      const userId = req.query.userId
        ? parseInt(req.query.userId as string)
        : undefined;
      const unreadNotifications = await storage.getUnreadNotifications(userId);
      res.json(unreadNotifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ error: "Error fetching unread notifications" });
    }
  });

  app.post(`${apiPrefix}/notifications`, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid notification data", details: error.errors });
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
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post(`${apiPrefix}/notifications/read-all`, async (req, res) => {
    try {
      const userId = req.body.userId ? parseInt(req.body.userId) : undefined;
      await storage.markAllNotificationsAsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
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
        userId: req.body.userId || null,
      });

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        notification,
      });
    } catch (error) {
      console.error("Error creating AI agent notification:", error);
      res.status(500).json({
        error: "Failed to create AI agent notification",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Diagnostic endpoint for checking Supabase authentication status
  app.get(`${apiPrefix}/system/db-auth-status`, async (req, res) => {
    try {
      console.log("Testing Supabase authentication status...");

      // Test if we can read from bookings
      const { data: readData, error: readError } = await supabase
        .from("bookings")
        .select("count");

      // Test if we can write to bookings
      const testBooking = {
        customer_name: "Auth Test",
        booking_time: new Date().toISOString(),
        party_size: 2,
        source: "system-test",
        ai_processed: false,
      };

      const { data: writeData, error: writeError } = await supabase
        .from("bookings")
        .insert([testBooking])
        .select();

      // If insert succeeded, delete the test booking
      let deleteResult = null;
      let deleteError = null;

      if (writeData && writeData.length > 0) {
        const { data, error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", writeData[0].id)
          .select();

        deleteResult = data;
        deleteError = error;
      }

      res.json({
        authStatus: {
          read: {
            success: !readError,
            error: readError ? readError.message : null,
          },
          write: {
            success: !writeError,
            error: writeError ? writeError.message : null,
            data: writeData ? "Test booking created" : null,
          },
          delete: {
            success: !deleteError,
            error: deleteError ? deleteError.message : null,
            data: deleteResult ? "Test booking deleted" : null,
          },
        },
      });
    } catch (error) {
      console.error("Error testing Supabase auth status:", error);
      res.status(500).json({
        error: "Error testing Supabase auth status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ===== INVENTORY MANAGEMENT ENDPOINTS =====

  // Get all inventory items
  app.get(`${apiPrefix}/inventory`, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      res.status(500).json({ error: "Failed to fetch inventory items" });
    }
  });

  // Get inventory items with low stock
  app.get(`${apiPrefix}/inventory/low-stock`, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  // Get inventory items by category
  app.get(`${apiPrefix}/inventory/category/:category`, async (req, res) => {
    try {
      const { category } = req.params;
      const items = await storage.getInventoryItemsByCategory(category);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory items by category:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch inventory items by category" });
    }
  });

  // Get a single inventory item
  app.get(`${apiPrefix}/inventory/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const item = await storage.getInventoryItemById(id);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });

  // Create a new inventory item
  app.post(`${apiPrefix}/inventory`, async (req, res) => {
    try {
      const item = req.body;
      const newItem = await storage.createInventoryItem(item);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(400).json({
        error: "Failed to create inventory item",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update an inventory item
  app.patch(`${apiPrefix}/inventory/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const updatedItem = await storage.updateInventoryItem(id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(400).json({
        error: "Failed to update inventory item",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update inventory stock (specific endpoint for deliveries)
  app.patch(`${apiPrefix}/inventory/:id/stock`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const { quantityChange, unitPrice, totalPrice } = req.body;

      if (quantityChange === undefined) {
        return res.status(400).json({ error: "Quantity change is required" });
      }

      const updatedItem = await storage.updateInventoryStock(
        id,
        quantityChange,
        unitPrice,
        totalPrice,
      );

      if (!updatedItem) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory stock:", error);
      res.status(400).json({
        error: "Failed to update inventory stock",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ===== RECIPE MANAGEMENT ENDPOINTS =====

  // Get all recipes
  app.get(`${apiPrefix}/recipes`, async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Get recipes by category
  app.get(`${apiPrefix}/recipes/category/:category`, async (req, res) => {
    try {
      const { category } = req.params;
      const recipes = await storage.getRecipesByCategory(category);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes by category:", error);
      res.status(500).json({ error: "Failed to fetch recipes by category" });
    }
  });

  // Get recipes by order type
  app.get(`${apiPrefix}/recipes/order-type/:orderType`, async (req, res) => {
    try {
      const { orderType } = req.params;
      const recipes = await storage.getRecipesByOrderType(orderType);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes by order type:", error);
      res.status(500).json({ error: "Failed to fetch recipes by order type" });
    }
  });

  // Get a single recipe
  app.get(`${apiPrefix}/recipes/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const recipe = await storage.getRecipeById(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Create a new recipe
  app.post(`${apiPrefix}/recipes`, async (req, res) => {
    try {
      const recipe = req.body;
      const newRecipe = await storage.createRecipe(recipe);
      res.status(201).json(newRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(400).json({
        error: "Failed to create recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update a recipe
  app.patch(`${apiPrefix}/recipes/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const updatedRecipe = await storage.updateRecipe(id, req.body);
      if (!updatedRecipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json(updatedRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(400).json({
        error: "Failed to update recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ===== RECIPE ITEMS ENDPOINTS =====

  // Get all items for a recipe with inventory details
  app.get(`${apiPrefix}/recipes/:recipeId/items`, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        return res.status(400).json({ error: "Invalid recipe ID format" });
      }

      const recipeItems = await storage.getRecipeItemsWithDetails(recipeId);
      res.json(recipeItems);
    } catch (error) {
      console.error("Error fetching recipe items:", error);
      res.status(500).json({
        error: "Failed to fetch recipe items",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Add an item to a recipe
  app.post(`${apiPrefix}/recipes/:recipeId/items`, async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        return res.status(400).json({ error: "Invalid recipe ID format" });
      }

      // Make sure recipe exists
      const recipe = await storage.getRecipeById(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Create the recipe item
      const recipeItem = {
        ...req.body,
        recipeId,
      };

      const newRecipeItem = await storage.createRecipeItem(recipeItem);
      res.status(201).json(newRecipeItem);
    } catch (error) {
      console.error("Error adding item to recipe:", error);
      res.status(400).json({
        error: "Failed to add item to recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update a recipe item
  app.patch(
    `${apiPrefix}/recipes/:recipeId/items/:itemId`,
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.itemId);
        if (isNaN(itemId)) {
          return res.status(400).json({ error: "Invalid item ID format" });
        }

        const updatedItem = await storage.updateRecipeItem(itemId, req.body);
        if (!updatedItem) {
          return res.status(404).json({ error: "Recipe item not found" });
        }

        res.json(updatedItem);
      } catch (error) {
        console.error("Error updating recipe item:", error);
        res.status(400).json({
          error: "Failed to update recipe item",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Delete a recipe item
  app.delete(
    `${apiPrefix}/recipes/:recipeId/items/:itemId`,
    async (req, res) => {
      try {
        const itemId = parseInt(req.params.itemId);
        if (isNaN(itemId)) {
          return res.status(400).json({ error: "Invalid item ID format" });
        }

        await storage.deleteRecipeItem(itemId);
        res.status(200).json({ message: "Recipe item deleted successfully" });
      } catch (error) {
        console.error("Error deleting recipe item:", error);
        res.status(500).json({
          error: "Failed to delete recipe item",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Process order and update inventory
  app.post(`${apiPrefix}/inventory/process-order`, async (req, res) => {
    try {
      const { dishName, orderType } = req.body;

      if (!dishName || !orderType) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Both dishName and orderType are required",
        });
      }

      const result = await storage.processOrderInventory(dishName, orderType);
      res.json(result);
    } catch (error) {
      console.error("Error processing order inventory:", error);
      res.status(500).json({
        error: "Failed to process order inventory",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Setup AI chatbot routes
  setupOpenAIRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

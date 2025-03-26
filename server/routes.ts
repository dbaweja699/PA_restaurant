import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertCallSchema, insertChatSchema, insertReviewSchema, insertOrderSchema, insertBookingSchema, insertSocialMediaSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for RestaurantAI Assistant
  const apiPrefix = "/api";
  
  // Dashboard
  app.get(`${apiPrefix}/dashboard/stats`, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats || { error: "No dashboard stats available" });
  });
  
  app.get(`${apiPrefix}/dashboard/performance`, async (req, res) => {
    const metrics = await storage.getLatestPerformanceMetrics();
    res.json(metrics || { error: "No performance metrics available" });
  });
  
  app.get(`${apiPrefix}/dashboard/activity`, async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await storage.getRecentActivityLogs(limit);
    res.json(logs);
  });
  
  // Calls
  app.get(`${apiPrefix}/calls`, async (req, res) => {
    const calls = await storage.getCalls();
    res.json(calls);
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
    const chats = await storage.getChats();
    res.json(chats);
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
    const reviews = await storage.getReviews();
    res.json(reviews);
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
    const orders = await storage.getOrders();
    res.json(orders);
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
    const bookings = await storage.getBookings();
    res.json(bookings);
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
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
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
    const social = await storage.getSocialMedia();
    res.json(social);
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
      // Get first user with ID 1 (assuming this is the main user)
      const user = await storage.getUser(1);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "No users found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

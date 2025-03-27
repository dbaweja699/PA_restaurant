
import { supabase } from './supabaseClient';
import { IStorage } from './storage';
import {
  User, InsertUser,
  Call, InsertCall,
  Chat, InsertChat,
  Review, InsertReview,
  Order, InsertOrder,
  Booking, InsertBooking,
  PerformanceMetrics, InsertPerformanceMetrics,
  ActivityLog, InsertActivityLog,
  SocialMedia, InsertSocialMedia,
  DashboardStats, InsertDashboardStats
} from "../shared/schema";

export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        // Handle "no rows returned" error gracefully
        if (error.code === 'PGRST116') {
          console.log(`No user found with id ${id}`);
          return undefined;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error(`Error retrieving user with ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        // Handle "no rows returned" error gracefully
        if (error.code === 'PGRST116') {
          console.log(`No user found with username "${username}"`);
          return undefined;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error(`Error retrieving user with username "${username}":`, error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Log the attempt for debugging
      console.log('Attempting to create user in Supabase:', {
        username: insertUser.username,
        full_name: insertUser.full_name,
        role: insertUser.role
      });
      
      // Ensure we use snake_case field names for the database
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: insertUser.username,
          password: insertUser.password,
          full_name: insertUser.full_name,
          role: insertUser.role || 'user',
          avatar_url: insertUser.avatar_url || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating user:', error);
        console.log('This is likely a permissions issue. The user will be informed to contact the database administrator.');
        // Return a mock user for now since we can't create the user in the DB
        // but this allows the UI to function
        const mockUser: User = {
          id: 0, // This indicates that this is a mock user
          username: insertUser.username,
          password: insertUser.password,
          full_name: insertUser.full_name,
          role: insertUser.role || 'user',
          avatar_url: insertUser.avatar_url || null
        };
        // Throw an error after logging the details so the route handler can respond appropriately
        throw new Error(`Unable to create user in database. Please contact administrator. Error: ${error.message}`);
      }
      
      console.log('User created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Exception in createUser:', error);
      throw error;
    }
  }

  // Call methods
  async getCalls(): Promise<Call[]> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching calls:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getCalls:', error);
      return [];
    }
  }

  async getCallById(id: number): Promise<Call | undefined> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No call found with id ${id}`);
          return undefined;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error(`Error retrieving call with ID ${id}:`, error);
      return undefined;
    }
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const { data, error } = await supabase
      .from('calls')
      .insert(insertCall)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCall(id: number, call: Partial<InsertCall>): Promise<Call | undefined> {
    const { data, error } = await supabase
      .from('calls')
      .update(call)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Chat methods
  async getChats(): Promise<Chat[]> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching chats:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getChats:', error);
      return [];
    }
  }

  async getChatById(id: number): Promise<Chat | undefined> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No chat found with id ${id}`);
          return undefined;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error(`Error retrieving chat with ID ${id}:`, error);
      return undefined;
    }
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const { data, error } = await supabase
      .from('chats')
      .insert(insertChat)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat | undefined> {
    const { data, error } = await supabase
      .from('chats')
      .update(chat)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Review methods
  async getReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Exception in getReviews:', error);
      return [];
    }
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No review found with id ${id}`);
          return undefined;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error(`Error retrieving review with ID ${id}:`, error);
      return undefined;
    }
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert(insertReview)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined> {
    const { data, error } = await supabase
      .from('reviews')
      .update(review)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(insertOrder)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from('orders')
      .update(order)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Booking methods
  async getBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(insertBooking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const { data, error } = await supabase
      .from('bookings')
      .update(booking)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Performance metrics methods
  async getPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getLatestPerformanceMetrics(): Promise<PerformanceMetrics | undefined> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.log('Error fetching performance metrics:', error.message);
      // Return undefined if no data is found
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data;
  }

  async createPerformanceMetrics(insertMetrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert(insertMetrics)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Activity log methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.log('Error fetching activity logs:', error.message);
      // Return empty array if there's an error
      if (error.code === 'PGRST116') return [];
      throw error;
    }
    return data || [];
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(insertLog)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Social media methods
  async getSocialMedia(): Promise<SocialMedia[]> {
    const { data, error } = await supabase
      .from('social_media')
      .select('*')
      .order('post_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async getSocialMediaById(id: number): Promise<SocialMedia | undefined> {
    const { data, error } = await supabase
      .from('social_media')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createSocialMedia(insertSocial: InsertSocialMedia): Promise<SocialMedia> {
    const { data, error } = await supabase
      .from('social_media')
      .insert(insertSocial)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateSocialMedia(id: number, social: Partial<InsertSocialMedia>): Promise<SocialMedia | undefined> {
    const { data, error } = await supabase
      .from('social_media')
      .update(social)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Dashboard stats methods
  async getDashboardStats(): Promise<DashboardStats | undefined> {
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.log('Error fetching dashboard stats:', error.message);
      // Return undefined if no data is found
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data;
  }

  async updateDashboardStats(stats: Partial<InsertDashboardStats>): Promise<DashboardStats | undefined> {
    const { data: existing } = await supabase
      .from('dashboard_stats')
      .select('id')
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .update(stats)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('dashboard_stats')
        .insert(stats)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
}

export const storage = new SupabaseStorage();

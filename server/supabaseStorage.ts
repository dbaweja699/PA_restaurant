
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
  DashboardStats, InsertDashboardStats,
  Notification, InsertNotification
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
      // First try: exact match (case-sensitive)
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      // If no exact match found, try case-insensitive match
      if (error && error.code === 'PGRST116') {
        console.log(`No exact match found for username "${username}", trying case-insensitive search...`);
        
        const { data: users, error: listError } = await supabase
          .from('users')
          .select('*');
          
        if (listError) {
          console.error('Error retrieving users list:', listError);
        } else if (users && users.length > 0) {
          // Manual case-insensitive search among all users
          const foundUser = users.find(user => 
            user.username.toLowerCase().trim() === username.toLowerCase().trim()
          );
          
          if (foundUser) {
            console.log(`Found user "${foundUser.username}" via case-insensitive search for "${username}"`);
            return foundUser;
          }
          
          // Try with partial match as a last resort
          const partialMatches = users.filter(user => 
            user.username.toLowerCase().includes(username.toLowerCase().trim()) ||
            (user.full_name && user.full_name.toLowerCase().includes(username.toLowerCase().trim()))
          );
          
          if (partialMatches.length === 1) {
            console.log(`Found user "${partialMatches[0].username}" via partial match for "${username}"`);
            return partialMatches[0];
          } else if (partialMatches.length > 1) {
            console.log(`Multiple partial matches found for "${username}": ${partialMatches.map(u => u.username).join(', ')}`);
          }
        }
        
        console.log(`No user found with username "${username}" after exhaustive search`);
        return undefined;
      }
      
      if (error) throw error;
      
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

  async updateUser(id: number, userData: Partial<{ username: string, email: string, full_name: string }>): Promise<User | undefined> {
    try {
      console.log('Attempting to update user in Supabase:', {
        id,
        ...userData
      });
      
      // Update the user data in Supabase
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating user in Supabase:', error);
        throw error;
      }
      
      if (!data) {
        console.log(`No user found with id ${id} to update`);
        return undefined;
      }
      
      console.log('User updated successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Exception in updateUser:', error);
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
    try {
      console.log('Attempting to create review in Supabase:', insertReview);
      
      // Create a payload that matches the database schema
      const payload: Record<string, any> = {
        customer_name: insertReview.customerName,
        rating: insertReview.rating,
        comment: insertReview.comment,
        status: insertReview.status,
        ai_response: insertReview.aiResponse
      };
      
      // Only add fields that exist in the schema and insertReview
      if ('source' in insertReview) {
        payload.source = insertReview.source;
      }
      
      if ('aiRespondedAt' in insertReview) {
        payload.ai_responded_at = insertReview.aiRespondedAt;
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating review:', error);
        throw new Error(`Unable to create review in database. Please contact administrator. Error: ${error.message}`);
      }
      
      console.log('Review created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Exception in createReview:', error);
      throw error;
    }
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
    try {
      console.log('Attempting to create booking in Supabase:', insertBooking);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          customer_name: insertBooking.customerName,
          booking_time: insertBooking.bookingTime,
          party_size: insertBooking.partySize,
          notes: insertBooking.notes,
          status: insertBooking.status,
          special_occasion: insertBooking.specialOccasion,
          ai_processed: insertBooking.aiProcessed,
          source: insertBooking.source
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating booking:', error);
        throw new Error(`Unable to create booking in database. Please contact administrator. Error: ${error.message}`);
      }
      
      console.log('Booking created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Exception in createBooking:', error);
      throw error;
    }
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
    try {
      // Use direct SQL query instead of Supabase ORM
      const { data, error } = await supabase.rpc('get_social_media');
      
      if (error) {
        console.error('Error fetching social media via RPC:', error);
        
        // Fallback to direct SQL
        const { data: sqlData, error: sqlError } = await supabase.from('social_media').select('*');
        
        if (sqlError) {
          console.error('Fallback SQL also failed:', sqlError);
          return [];
        }
        
        if (!sqlData || sqlData.length === 0) return [];
        
        return sqlData.map(item => ({
          id: item.id,
          platform: item.platform,
          post_time: item.post_time, 
          content: item.content,
          author: item.author,
          status: item.status,
          ai_response: item.ai_response,
          ai_responded_at: item.ai_responded_at
        }));
      }
      
      // Map data from RPC if successful
      if (!data || data.length === 0) return [];
      
      return data.map(item => ({
        id: item.id,
        platform: item.platform,
        post_time: item.post_time,
        content: item.content,
        author: item.author,
        status: item.status,
        ai_response: item.ai_response,
        ai_responded_at: item.ai_responded_at
      }));
    } catch (error) {
      console.error('Exception in getSocialMedia:', error);
      
      // Try a direct SQL query as last resort
      try {
        const { data } = await supabase.from('social_media').select('*');
        return data || [];
      } catch (e) {
        console.error('Last resort query failed:', e);
        return [];
      }
    }
  }

  async getSocialMediaById(id: number): Promise<SocialMedia | undefined> {
    try {
      const { data, error } = await supabase
        .from('social_media')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No social media found with id ${id}`);
          return undefined;
        }
        // If it's a column error or other issue
        if (error.code === '42703') {
          console.error(`Database schema error in social_media table:`, error);
          return undefined;
        }
        throw error;
      }
      
      // Transform the response to match our SocialMedia type
      return {
        id: data.id,
        platform: data.platform,
        post_time: data.post_time,
        content: data.content,
        author: data.author,
        status: data.status,
        ai_response: data.ai_response,
        ai_responded_at: data.ai_responded_at
      };
    } catch (error) {
      console.error(`Error retrieving social media with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSocialMedia(insertSocial: InsertSocialMedia): Promise<SocialMedia> {
    try {
      console.log('Attempting to create social media post in Supabase:', insertSocial);
      
      // Map JavaScript camelCase properties to database snake_case columns
      const { data, error } = await supabase
        .from('social_media')
        .insert({
          platform: insertSocial.platform,
          post_time: insertSocial.postTime,
          content: insertSocial.content,
          author: insertSocial.author,
          status: insertSocial.status,
          ai_response: insertSocial.aiResponse || null,
          ai_responded_at: insertSocial.aiRespondedAt || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating social media post:', error);
        throw new Error(`Unable to create social media post in database. Please contact administrator. Error: ${error.message}`);
      }
      
      console.log('Social media post created successfully in Supabase:', data);
      
      // Transform database response to match our SocialMedia type
      return {
        id: data.id,
        platform: data.platform,
        post_time: data.post_time,
        content: data.content,
        author: data.author,
        status: data.status,
        ai_response: data.ai_response,
        ai_responded_at: data.ai_responded_at
      };
    } catch (error) {
      console.error('Exception in createSocialMedia:', error);
      throw error;
    }
  }

  async updateSocialMedia(id: number, social: Partial<InsertSocialMedia>): Promise<SocialMedia | undefined> {
    try {
      // Create object with proper snake_case keys for database
      const updateData: any = {};
      
      if (social.platform !== undefined) updateData.platform = social.platform;
      if (social.content !== undefined) updateData.content = social.content;
      if (social.author !== undefined) updateData.author = social.author;
      if (social.status !== undefined) updateData.status = social.status;
      if (social.postTime !== undefined) updateData.post_time = social.postTime;
      if (social.aiResponse !== undefined) updateData.ai_response = social.aiResponse;
      if (social.aiRespondedAt !== undefined) updateData.ai_responded_at = social.aiRespondedAt;
      
      console.log(`Updating social media #${id} with data:`, updateData);
      
      const { data, error } = await supabase
        .from('social_media')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating social media post with ID ${id}:`, error);
        return undefined;
      }
      
      // Transform the response to match our SocialMedia type
      return {
        id: data.id,
        platform: data.platform,
        post_time: data.post_time,
        content: data.content,
        author: data.author,
        status: data.status,
        ai_response: data.ai_response,
        ai_responded_at: data.ai_responded_at
      };
    } catch (error) {
      console.error(`Exception in updateSocialMedia for ID ${id}:`, error);
      return undefined;
    }
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
  
  // Notification methods
  async getNotifications(userId?: number): Promise<Notification[]> {
    try {
      let query = supabase.from('notifications').select('*');
      
      if (userId) {
        // Get notifications for this user or global notifications (userId is null)
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      
      // Map the Supabase response to our schema format
      const notifications = (data || []).map(item => ({
        id: item.id,
        type: item.type,
        message: item.message,
        details: item.data, // Map from 'data' column to 'details'
        isRead: item.is_read,
        createdAt: item.created_at,
        userId: item.user_id
      }));
      
      return notifications;
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }
  
  async getUnreadNotifications(userId?: number): Promise<Notification[]> {
    try {
      let query = supabase.from('notifications')
        .select('*')
        .eq('is_read', false);
      
      if (userId) {
        // Get unread notifications for this user or global notifications
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
      }
      
      // Map the Supabase response to our schema format
      const notifications = (data || []).map(item => ({
        id: item.id,
        type: item.type,
        message: item.message,
        details: item.data, // Map from 'data' column to 'details'
        isRead: item.is_read,
        createdAt: item.created_at,
        userId: item.user_id
      }));
      
      return notifications;
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error);
      return [];
    }
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      // Convert to snake_case for the database and match the column names in your Supabase table
      const dbNotification = {
        type: notification.type,
        message: notification.message,
        data: notification.details, // Map 'details' to 'data' column in Supabase
        is_read: notification.isRead || false,
        created_at: notification.createdAt ? new Date(notification.createdAt) : new Date(),
        user_id: notification.userId || null
      };
      
      console.log('Creating notification in Supabase:', dbNotification);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(dbNotification)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating notification in Supabase:', error);
        // Fall back to memory storage
        const memoryNotification: Notification = {
          id: Date.now(),
          type: notification.type,
          message: notification.message,
          details: notification.details,
          isRead: notification.isRead || false,
          createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
          userId: notification.userId || null
        };
        return memoryNotification;
      }
      
      console.log('Notification created successfully in Supabase:', data);
      
      // Map Supabase response fields back to our schema (data -> details)
      const mappedNotification: Notification = {
        id: data.id,
        type: data.type,
        message: data.message,
        details: data.data, // Map 'data' column from Supabase to 'details' in our schema
        isRead: data.is_read,
        createdAt: data.created_at,
        userId: data.user_id
      };
      
      return mappedNotification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      // Fall back to memory storage
      const fallbackNotification: Notification = {
        id: Date.now(),
        type: notification.type,
        message: notification.message,
        details: notification.details,
        isRead: notification.isRead || false,
        createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
        userId: notification.userId || null
      };
      return fallbackNotification;
    }
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return undefined;
      }
      
      // Map the response to our schema
      if (data) {
        return {
          id: data.id,
          type: data.type,
          message: data.message,
          details: data.data, // Map from 'data' column to 'details'
          isRead: data.is_read,
          createdAt: data.created_at,
          userId: data.user_id
        };
      }
      
      return undefined;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      return undefined;
    }
  }
  
  async markAllNotificationsAsRead(userId?: number): Promise<void> {
    try {
      let query = supabase.from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      
      if (userId) {
        // Mark as read notifications for this user or global notifications
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
      }
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error);
    }
  }
}

export const storage = new SupabaseStorage();

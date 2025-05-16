
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
  Notification, InsertNotification,
  Inventory, InsertInventory,
  Recipe, InsertRecipe,
  RecipeItem, InsertRecipeItem,
  PhotoGallary, InsertPhotoGallary
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
      
      // Create the booking data object based on what exists in the actual database
      const bookingData = {
        customer_name: insertBooking.customerName,
        booking_time: insertBooking.bookingTime,
        party_size: insertBooking.partySize,
        notes: insertBooking.notes || null,
        special_occasion: insertBooking.specialOccasion || null,
        ai_processed: insertBooking.aiProcessed !== undefined ? insertBooking.aiProcessed : true,
        source: insertBooking.source || 'website'
      };
      
      console.log('Sending booking data to Supabase:', bookingData);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
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
  
  async updatePerformanceMetrics(metrics: Partial<InsertPerformanceMetrics>): Promise<PerformanceMetrics | undefined> {
    try {
      // Get the latest metrics first
      const latestMetrics = await this.getLatestPerformanceMetrics();
      if (!latestMetrics) {
        // If no metrics exist, create new ones
        return await this.createPerformanceMetrics(metrics as InsertPerformanceMetrics);
      }
      
      // Update the existing metrics
      const { data, error } = await supabase
        .from('performance_metrics')
        .update(metrics)
        .eq('id', latestMetrics.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating performance metrics:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Exception in updatePerformanceMetrics:', error);
      return undefined;
    }
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
        
        return sqlData;
      }
      
      // Map data from RPC if successful
      if (!data || data.length === 0) return [];
      
      return data;
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
      
      // Return data directly
      return data;
    } catch (error) {
      console.error(`Error retrieving social media with ID ${id}:`, error);
      return undefined;
    }
  }

  async createSocialMedia(insertSocial: InsertSocialMedia): Promise<SocialMedia> {
    try {
      console.log('Attempting to create social media post in Supabase:', insertSocial);
      
      // Map JavaScript camelCase properties to database snake_case columns
      // Only include fields that actually exist in the table structure
      const insertData: any = {
        platform: insertSocial.platform || 'website'
      };
      
      // Add optional fields if they exist
      if (insertSocial.prompt) {
        insertData.prompt = insertSocial.prompt;
      }
      
      if (insertSocial.post_content) {
        insertData.post_content = insertSocial.post_content;
      }
      
      if (insertSocial.image_file_name) {
        insertData.image_file_name = insertSocial.image_file_name;
      }
      
      if (insertSocial.caption) {
        insertData.caption = insertSocial.caption;
      }
      
      console.log('Final insert data:', insertData);
      
      const { data, error } = await supabase
        .from('social_media')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating social media post:', error);
        throw new Error(`Unable to create social media post in database. Please contact administrator. Error: ${error.message}`);
      }
      
      console.log('Social media post created successfully in Supabase:', data);
      
      // Return the data directly since it matches our schema
      return data;
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
      if (social.prompt !== undefined) updateData.prompt = social.prompt;
      if (social.post_content !== undefined) updateData.post_content = social.post_content;
      if (social.image_file_name !== undefined) updateData.image_file_name = social.image_file_name;
      if (social.caption !== undefined) updateData.caption = social.caption;
      
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
      
      // Return data directly since it matches our schema
      return data;
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

  // Inventory Management Operations
  async getInventoryItems(): Promise<Inventory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('id');
      
      if (error) {
        console.error('Error fetching inventory items:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        itemName: item.item_name,
        unitOfMeasurement: item.unit_of_measurement,
        boxOrPackageQty: item.box_or_package_qty,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        idealQty: item.ideal_qty,
        currentQty: item.current_qty,
        shelfLifeDays: item.shelf_life_days,
        lastUpdated: new Date(item.last_updated),
        category: item.category
      }));
    } catch (error) {
      console.error('Error in getInventoryItems:', error);
      return [];
    }
  }

  async getInventoryItemById(id: number): Promise<Inventory | undefined> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching inventory item by ID:', error);
        return undefined;
      }
      
      return {
        id: data.id,
        itemName: data.item_name,
        unitOfMeasurement: data.unit_of_measurement,
        boxOrPackageQty: data.box_or_package_qty,
        unitPrice: data.unit_price,
        totalPrice: data.total_price,
        idealQty: data.ideal_qty,
        currentQty: data.current_qty,
        shelfLifeDays: data.shelf_life_days,
        lastUpdated: new Date(data.last_updated),
        category: data.category
      };
    } catch (error) {
      console.error('Error in getInventoryItemById:', error);
      return undefined;
    }
  }

  async getInventoryItemsByCategory(category: string): Promise<Inventory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('category', category)
        .order('item_name');
      
      if (error) {
        console.error('Error fetching inventory items by category:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        itemName: item.item_name,
        unitOfMeasurement: item.unit_of_measurement,
        boxOrPackageQty: item.box_or_package_qty,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        idealQty: item.ideal_qty,
        currentQty: item.current_qty,
        shelfLifeDays: item.shelf_life_days,
        lastUpdated: new Date(item.last_updated),
        category: item.category
      }));
    } catch (error) {
      console.error('Error in getInventoryItemsByCategory:', error);
      return [];
    }
  }

  async getLowStockItems(): Promise<Inventory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .filter('current_qty', 'lt', supabase.raw('ideal_qty'))
        .order('item_name');
      
      if (error) {
        console.error('Error fetching low stock items:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        itemName: item.item_name,
        unitOfMeasurement: item.unit_of_measurement,
        boxOrPackageQty: item.box_or_package_qty,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        idealQty: item.ideal_qty,
        currentQty: item.current_qty,
        shelfLifeDays: item.shelf_life_days,
        lastUpdated: new Date(item.last_updated),
        category: item.category
      }));
    } catch (error) {
      console.error('Error in getLowStockItems:', error);
      return [];
    }
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          item_name: item.itemName,
          unit_of_measurement: item.unitOfMeasurement,
          box_or_package_qty: item.boxOrPackageQty,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          ideal_qty: item.idealQty,
          current_qty: item.currentQty || 0,
          shelf_life_days: item.shelfLifeDays || null,
          last_updated: new Date().toISOString(),
          category: item.category || null
        }])
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error creating inventory item:', error);
        throw new Error('Failed to create inventory item');
      }
      
      return {
        id: data.id,
        itemName: data.item_name,
        unitOfMeasurement: data.unit_of_measurement,
        boxOrPackageQty: data.box_or_package_qty,
        unitPrice: data.unit_price,
        totalPrice: data.total_price,
        idealQty: data.ideal_qty,
        currentQty: data.current_qty,
        shelfLifeDays: data.shelf_life_days,
        lastUpdated: new Date(data.last_updated),
        category: data.category
      };
    } catch (error) {
      console.error('Error in createInventoryItem:', error);
      throw new Error('Failed to create inventory item');
    }
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    try {
      const updateData: Record<string, any> = {};
      
      if (item.itemName !== undefined) updateData.item_name = item.itemName;
      if (item.unitOfMeasurement !== undefined) updateData.unit_of_measurement = item.unitOfMeasurement;
      if (item.boxOrPackageQty !== undefined) updateData.box_or_package_qty = item.boxOrPackageQty;
      if (item.unitPrice !== undefined) updateData.unit_price = item.unitPrice;
      if (item.totalPrice !== undefined) updateData.total_price = item.totalPrice;
      if (item.idealQty !== undefined) updateData.ideal_qty = item.idealQty;
      if (item.currentQty !== undefined) updateData.current_qty = item.currentQty;
      if (item.shelfLifeDays !== undefined) updateData.shelf_life_days = item.shelfLifeDays;
      if (item.category !== undefined) updateData.category = item.category;
      
      // Always update the last_updated timestamp
      updateData.last_updated = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error updating inventory item:', error);
        return undefined;
      }
      
      return {
        id: data.id,
        itemName: data.item_name,
        unitOfMeasurement: data.unit_of_measurement,
        boxOrPackageQty: data.box_or_package_qty,
        unitPrice: data.unit_price,
        totalPrice: data.total_price,
        idealQty: data.ideal_qty,
        currentQty: data.current_qty,
        shelfLifeDays: data.shelf_life_days,
        lastUpdated: new Date(data.last_updated),
        category: data.category
      };
    } catch (error) {
      console.error('Error in updateInventoryItem:', error);
      return undefined;
    }
  }

  async updateInventoryStock(id: number, quantityChange: number, unitPrice?: string, totalPrice?: string): Promise<Inventory | undefined> {
    try {
      // First get the current inventory item
      const { data: existingItem, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingItem) {
        console.error('Error fetching inventory item for stock update:', fetchError);
        return undefined;
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {
        current_qty: existingItem.current_qty + quantityChange,
        last_updated: new Date().toISOString()
      };
      
      if (unitPrice) updateData.unit_price = unitPrice;
      if (totalPrice) updateData.total_price = totalPrice;
      
      // Update the inventory item
      const { data, error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error updating inventory stock:', error);
        return undefined;
      }
      
      return {
        id: data.id,
        itemName: data.item_name,
        unitOfMeasurement: data.unit_of_measurement,
        boxOrPackageQty: data.box_or_package_qty,
        unitPrice: data.unit_price,
        totalPrice: data.total_price,
        idealQty: data.ideal_qty,
        currentQty: data.current_qty,
        shelfLifeDays: data.shelf_life_days,
        lastUpdated: new Date(data.last_updated),
        category: data.category
      };
    } catch (error) {
      console.error('Error in updateInventoryStock:', error);
      return undefined;
    }
  }

  // Recipe Management Operations
  async getRecipes(): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('dish_name');
      
      if (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }
      
      return data.map(recipe => ({
        id: recipe.id,
        dishName: recipe.dish_name,
        orderType: recipe.order_type,
        description: recipe.description,
        sellingPrice: recipe.selling_price,
        category: recipe.category,
        isActive: recipe.is_active,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at)
      }));
    } catch (error) {
      console.error('Error in getRecipes:', error);
      return [];
    }
  }

  async getRecipeById(id: number): Promise<Recipe | undefined> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error('Error fetching recipe by ID:', error);
        return undefined;
      }
      
      return {
        id: data.id,
        dishName: data.dish_name,
        orderType: data.order_type,
        description: data.description,
        sellingPrice: data.selling_price,
        category: data.category,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getRecipeById:', error);
      return undefined;
    }
  }

  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('category', category)
        .order('dish_name');
      
      if (error) {
        console.error('Error fetching recipes by category:', error);
        return [];
      }
      
      return data.map(recipe => ({
        id: recipe.id,
        dishName: recipe.dish_name,
        orderType: recipe.order_type,
        description: recipe.description,
        sellingPrice: recipe.selling_price,
        category: recipe.category,
        isActive: recipe.is_active,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at)
      }));
    } catch (error) {
      console.error('Error in getRecipesByCategory:', error);
      return [];
    }
  }

  async getRecipesByOrderType(orderType: string): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('order_type', orderType)
        .order('dish_name');
      
      if (error) {
        console.error('Error fetching recipes by order type:', error);
        return [];
      }
      
      return data.map(recipe => ({
        id: recipe.id,
        dishName: recipe.dish_name,
        orderType: recipe.order_type,
        description: recipe.description,
        sellingPrice: recipe.selling_price,
        category: recipe.category,
        isActive: recipe.is_active,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at)
      }));
    } catch (error) {
      console.error('Error in getRecipesByOrderType:', error);
      return [];
    }
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          dish_name: recipe.dishName,
          order_type: recipe.orderType,
          description: recipe.description || null,
          selling_price: recipe.sellingPrice || null,
          category: recipe.category || null,
          is_active: recipe.isActive !== undefined ? recipe.isActive : true,
          created_at: now,
          updated_at: now
        }])
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error creating recipe:', error);
        throw new Error('Failed to create recipe');
      }
      
      return {
        id: data.id,
        dishName: data.dish_name,
        orderType: data.order_type,
        description: data.description,
        sellingPrice: data.selling_price,
        category: data.category,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in createRecipe:', error);
      throw new Error('Failed to create recipe');
    }
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (recipe.dishName !== undefined) updateData.dish_name = recipe.dishName;
      if (recipe.orderType !== undefined) updateData.order_type = recipe.orderType;
      if (recipe.description !== undefined) updateData.description = recipe.description;
      if (recipe.sellingPrice !== undefined) updateData.selling_price = recipe.sellingPrice;
      if (recipe.category !== undefined) updateData.category = recipe.category;
      if (recipe.isActive !== undefined) updateData.is_active = recipe.isActive;
      
      const { data, error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error updating recipe:', error);
        return undefined;
      }
      
      return {
        id: data.id,
        dishName: data.dish_name,
        orderType: data.order_type,
        description: data.description,
        sellingPrice: data.selling_price,
        category: data.category,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in updateRecipe:', error);
      return undefined;
    }
  }

  // Recipe Items Operations
  async getRecipeItems(recipeId: number): Promise<RecipeItem[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_items')
        .select('*')
        .eq('recipe_id', recipeId);
      
      if (error) {
        console.error('Error fetching recipe items:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        recipeId: item.recipe_id,
        inventoryId: item.inventory_id,
        quantityRequired: item.quantity_required,
        unit: item.unit
      }));
    } catch (error) {
      console.error('Error in getRecipeItems:', error);
      return [];
    }
  }

  async getRecipeItemsWithDetails(recipeId: number): Promise<(RecipeItem & { inventoryItem: Inventory })[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_items')
        .select(`
          *,
          inventory:inventory_id (*)
        `)
        .eq('recipe_id', recipeId);
      
      if (error) {
        console.error('Error fetching recipe items with details:', error);
        return [];
      }
      
      return data.map(item => {
        const inventoryItem = item.inventory;
        return {
          id: item.id,
          recipeId: item.recipe_id,
          inventoryId: item.inventory_id,
          quantityRequired: item.quantity_required,
          unit: item.unit,
          inventoryItem: {
            id: inventoryItem.id,
            itemName: inventoryItem.item_name,
            unitOfMeasurement: inventoryItem.unit_of_measurement,
            boxOrPackageQty: inventoryItem.box_or_package_qty,
            unitPrice: inventoryItem.unit_price,
            totalPrice: inventoryItem.total_price,
            idealQty: inventoryItem.ideal_qty,
            currentQty: inventoryItem.current_qty,
            shelfLifeDays: inventoryItem.shelf_life_days,
            lastUpdated: new Date(inventoryItem.last_updated),
            category: inventoryItem.category
          }
        };
      });
    } catch (error) {
      console.error('Error in getRecipeItemsWithDetails:', error);
      return [];
    }
  }

  async createRecipeItem(item: InsertRecipeItem): Promise<RecipeItem> {
    try {
      const { data, error } = await supabase
        .from('recipe_items')
        .insert([{
          recipe_id: item.recipeId,
          inventory_id: item.inventoryId,
          quantity_required: item.quantityRequired,
          unit: item.unit
        }])
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error creating recipe item:', error);
        throw new Error('Failed to create recipe item');
      }
      
      return {
        id: data.id,
        recipeId: data.recipe_id,
        inventoryId: data.inventory_id,
        quantityRequired: data.quantity_required,
        unit: data.unit
      };
    } catch (error) {
      console.error('Error in createRecipeItem:', error);
      throw new Error('Failed to create recipe item');
    }
  }

  async updateRecipeItem(id: number, item: Partial<InsertRecipeItem>): Promise<RecipeItem | undefined> {
    try {
      const updateData: Record<string, any> = {};
      
      if (item.recipeId !== undefined) updateData.recipe_id = item.recipeId;
      if (item.inventoryId !== undefined) updateData.inventory_id = item.inventoryId;
      if (item.quantityRequired !== undefined) updateData.quantity_required = item.quantityRequired;
      if (item.unit !== undefined) updateData.unit = item.unit;
      
      const { data, error } = await supabase
        .from('recipe_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) {
        console.error('Error updating recipe item:', error);
        return undefined;
      }
      
      return {
        id: data.id,
        recipeId: data.recipe_id,
        inventoryId: data.inventory_id,
        quantityRequired: data.quantity_required,
        unit: data.unit
      };
    } catch (error) {
      console.error('Error in updateRecipeItem:', error);
      return undefined;
    }
  }

  async deleteRecipeItem(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipe_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting recipe item:', error);
        throw new Error('Failed to delete recipe item');
      }
    } catch (error) {
      console.error('Error in deleteRecipeItem:', error);
      throw new Error('Failed to delete recipe item');
    }
  }

  // Process Order and Update Inventory
  async processOrderInventory(dishName: string, orderType: string): Promise<{ success: boolean, lowStockItems: Inventory[] }> {
    try {
      // First, find the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('id')
        .eq('dish_name', dishName)
        .eq('order_type', orderType)
        .single();
      
      if (recipeError || !recipeData) {
        console.error(`Recipe not found for dish: ${dishName}, order type: ${orderType}`, recipeError);
        throw new Error(`Recipe not found for dish: ${dishName}, order type: ${orderType}`);
      }
      
      const recipeId = recipeData.id;
      
      // Get all recipe items with their inventory details
      const recipeItems = await this.getRecipeItemsWithDetails(recipeId);
      
      if (recipeItems.length === 0) {
        throw new Error(`No ingredients found for recipe: ${dishName}`);
      }
      
      // Deduct quantities from inventory
      const updatedInventory: Inventory[] = [];
      
      for (const item of recipeItems) {
        // Parse quantity required
        const qtyRequired = parseFloat(item.quantityRequired);
        
        // Update inventory (deduct quantity)
        const updatedItem = await this.updateInventoryStock(item.inventoryId, -qtyRequired);
        if (updatedItem) {
          updatedInventory.push(updatedItem);
        }
      }
      
      // Find items that are below ideal stock level
      const lowStockItems = await this.getLowStockItems();
      
      return {
        success: true,
        lowStockItems
      };
    } catch (error) {
      console.error('Error in processOrderInventory:', error);
      throw new Error(`Error processing order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const storage = new SupabaseStorage();

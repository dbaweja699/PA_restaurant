import * as schema from '@shared/schema';
import dotenv from 'dotenv';
import { db, pool } from './db';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

// Load environment variables
dotenv.config();

// Drop all tables and recreate
async function migrateTables() {
  try {
    console.log('Starting database migration...');
    
    // Drop all existing tables to start fresh
    await db.execute(`
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS calls CASCADE;
      DROP TABLE IF EXISTS chats CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS performance_metrics CASCADE;
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS social_media CASCADE;
      DROP TABLE IF EXISTS dashboard_stats CASCADE;
    `);
    
    console.log('Dropped all existing tables');
    console.log('Creating tables based on schema definitions...');
    
    // Create users table with avatar_url
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar_url TEXT
      );
    `);
    
    // Create calls table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration INTEGER,
        topic TEXT,
        summary TEXT,
        ai_handled BOOLEAN NOT NULL,
        transferred_to_human BOOLEAN NOT NULL
      );
    `);
    
    // Create chats table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        topic TEXT,
        summary TEXT,
        ai_handled BOOLEAN NOT NULL,
        transferred_to_human BOOLEAN NOT NULL,
        customer_name TEXT,
        source TEXT NOT NULL
      );
    `);
    
    // Create reviews table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        source TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        ai_response TEXT,
        ai_responded_at TIMESTAMP
      );
    `);
    
    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        order_time TIMESTAMP NOT NULL,
        items JSONB NOT NULL,
        total TEXT NOT NULL,
        ai_processed BOOLEAN NOT NULL
      );
    `);
    
    // Create bookings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        source TEXT NOT NULL,
        ai_processed BOOLEAN NOT NULL,
        booking_time TIMESTAMP NOT NULL,
        party_size INTEGER NOT NULL,
        notes TEXT,
        special_occasion TEXT
      );
    `);
    
    // Create performance_metrics table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL,
        customer_satisfaction INTEGER,
        response_time INTEGER,
        issue_resolution INTEGER,
        handoff_rate INTEGER,
        overall_efficiency INTEGER
      );
    `);
    
    // Create activity_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        activity_type TEXT NOT NULL,
        activity_id INTEGER NOT NULL
      );
    `);
    
    // Create social_media table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS social_media (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        ai_response TEXT,
        ai_responded_at TIMESTAMP,
        platform TEXT NOT NULL,
        post_time TIMESTAMP NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL
      );
    `);
    
    // Create dashboard_stats table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dashboard_stats (
        id SERIAL PRIMARY KEY,
        date TIMESTAMP NOT NULL,
        calls_handled_today INTEGER NOT NULL,
        active_chats INTEGER NOT NULL,
        todays_bookings INTEGER NOT NULL,
        orders_processed INTEGER NOT NULL,
        orders_total_value TEXT NOT NULL
      );
    `);
    
    console.log('Migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
migrateTables();
/*
# AI Content Hub Database Schema
Complete database setup for the AI Content Hub application with user management, content generation tracking, and security policies.

## Query Description:
This migration creates the essential database structure for the AI Content Hub. It establishes user profiles linked to Supabase Auth, content storage for AI generations, and implements comprehensive security policies. The schema supports daily usage limits, pro membership features, and encrypted API key storage. All operations are safe and create new structures without affecting existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- users table: Stores user profiles, daily limits, and encrypted API keys
- creations table: Stores all AI-generated content with user associations
- RLS policies for secure data access
- Indexes for performance optimization

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Supabase Auth integration required

## Performance Impact:
- Indexes: Added for user lookups and creation queries
- Triggers: None
- Estimated Impact: Minimal - new tables only
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table to extend Supabase auth.users
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  daily_generation_count INTEGER DEFAULT 0,
  last_generation_date DATE,
  is_pro_member BOOLEAN DEFAULT false,
  api_key_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creations table to store AI-generated content
CREATE TABLE IF NOT EXISTS creations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  generated_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_generation_date ON users(last_generation_date);
CREATE INDEX IF NOT EXISTS idx_creations_user_id ON creations(user_id);
CREATE INDEX IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for creations table
CREATE POLICY "Users can view own creations" ON creations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own creations" ON creations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creations" ON creations 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations" ON creations 
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

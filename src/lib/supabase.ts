import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_API_KEY' && 
  supabaseAnonKey !== 'YOUR_API_KEY' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseReady = isSupabaseConfigured

export type User = {
  id: string
  email: string
  display_name: string
  daily_generation_count: number
  last_generation_date: string
  is_pro_member: boolean
  api_key_encrypted?: string
}

export type Creation = {
  id: string
  user_id: string
  prompt: string
  generated_text: string
  generated_image_url: string
  created_at: string
}

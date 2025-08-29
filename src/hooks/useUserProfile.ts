import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import type { User } from '../lib/supabase'

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    if (!isSupabaseReady) {
      // Set a mock profile for demo purposes when Supabase is not configured
      setProfile({
        id: userId,
        email: 'demo@example.com',
        display_name: 'Demo User',
        daily_generation_count: 2,
        last_generation_date: new Date().toISOString().split('T')[0],
        is_pro_member: false
      })
      setLoading(false)
      return
    }

    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    if (!userId || !isSupabaseReady) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, this might be first time user
        console.error('Error fetching user profile:', error)
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateDailyCount = async () => {
    if (!userId || !profile || !isSupabaseReady) return

    const today = new Date().toISOString().split('T')[0]
    const isNewDay = profile.last_generation_date !== today

    const newCount = isNewDay ? 1 : profile.daily_generation_count + 1

    try {
      const { error } = await supabase
        .from('users')
        .update({
          daily_generation_count: newCount,
          last_generation_date: today
        })
        .eq('id', userId)

      if (error) throw error
      
      setProfile(prev => prev ? {
        ...prev,
        daily_generation_count: newCount,
        last_generation_date: today
      } : null)
    } catch (error) {
      console.error('Error updating daily count:', error)
    }
  }

  const getRemainingGenerations = () => {
    if (!profile) return 0
    
    const today = new Date().toISOString().split('T')[0]
    const isNewDay = profile.last_generation_date !== today
    
    if (isNewDay) return 5
    
    return Math.max(0, 5 - profile.daily_generation_count)
  }

  return {
    profile,
    loading,
    updateDailyCount,
    getRemainingGenerations,
    refetch: fetchProfile
  }
}

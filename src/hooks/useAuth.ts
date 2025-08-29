import { useState, useEffect } from 'react'
import { supabase, isSupabaseReady } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseReady) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Create user profile on first sign in
        if (event === 'SIGNED_IN' && session?.user) {
          await createUserProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const createUserProfile = async (user: SupabaseUser) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          daily_generation_count: 0,
          last_generation_date: new Date().toISOString().split('T')[0],
          is_pro_member: false
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('Error creating user profile:', error)
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
    }
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseReady) {
      alert('Please connect your Supabase project first!')
      return
    }

    try {
      // This is the fix: Explicitly provide the redirect URL.
      // This ensures Supabase knows exactly where to send the user back to
      // after they successfully authenticate with Google.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error)
      alert('Failed to sign in. Please check your Supabase configuration and the browser console for more details.')
    }
  }

  const signOut = async () => {
    if (!isSupabaseReady) {
      return
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isSupabaseReady
  }
}

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Clock, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { supabase } from '../lib/supabase'
import type { Creation } from '../lib/supabase'

export function Dashboard() {
  const { user } = useAuth()
  const { profile } = useUserProfile(user?.id)
  const [recentCreations, setRecentCreations] = useState<Creation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchRecentCreations()
    }
  }, [user?.id])

  const fetchRecentCreations = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setRecentCreations(data || [])
    } catch (error) {
      console.error('Error fetching recent creations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRemainingGenerations = () => {
    if (!profile) return 0
    
    const today = new Date().toISOString().split('T')[0]
    const isNewDay = profile.last_generation_date !== today
    
    if (isNewDay) return 5
    
    return Math.max(0, 5 - profile.daily_generation_count)
  }

  const stats = [
    {
      name: 'Remaining Today',
      value: getRemainingGenerations().toString(),
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      name: 'Total Creations',
      value: profile?.daily_generation_count.toString() || '0',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.user_metadata?.full_name || user?.email}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Here's what's happening with your AI content generation.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Content
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Creations */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Creations
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your latest AI-generated content
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/my-creations"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : recentCreations.length > 0 ? (
            recentCreations.map((creation) => (
              <motion.div
                key={creation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 truncate">
                    {creation.prompt}
                  </h3>
                  {creation.generated_image_url && (
                    <img
                      src={creation.generated_image_url}
                      alt="Generated content"
                      className="w-full h-32 object-cover rounded mb-4"
                    />
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {creation.generated_text}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(creation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 dark:text-gray-500">
                <Plus className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  No creations yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by generating your first piece of content.
                </p>
                <div className="mt-6">
                  <Link
                    to="/generate"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Generate Content
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

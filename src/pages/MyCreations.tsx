import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, Image, FileText } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Creation } from '../lib/supabase'

export function MyCreations() {
  const { user } = useAuth()
  const [creations, setCreations] = useState<Creation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchCreations()
    }
  }, [user?.id])

  const fetchCreations = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCreations(data || [])
    } catch (error) {
      console.error('Error fetching creations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCreations = creations.filter(creation =>
    creation.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creation.generated_text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              My Creations
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              All your AI-generated content in one place
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search your creations..."
            />
          </div>
        </div>

        {/* Creations Grid */}
        <div className="mt-8">
          {filteredCreations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreations.map((creation, index) => (
                <motion.div
                  key={creation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {creation.prompt}
                      </h3>
                      <div className="flex space-x-1 ml-2">
                        {creation.generated_image_url && (
                          <Image className="h-4 w-4 text-gray-400" />
                        )}
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    {creation.generated_image_url && (
                      <div className="mb-4">
                        <img
                          src={creation.generated_image_url}
                          alt="Generated content"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 mb-4">
                      {creation.generated_text}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(creation.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500">
                {searchTerm ? (
                  <>
                    <Search className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      No results found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search terms.
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      No creations yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Start generating content to see your creations here.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

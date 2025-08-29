import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Loader, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUserProfile } from '../hooks/useUserProfile'
import { supabase } from '../lib/supabase'

export function Generate() {
  const { user } = useAuth()
  const { profile, updateDailyCount } = useUserProfile(user?.id)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    text: string
    imageUrl: string
  } | null>(null)

  const getRemainingGenerations = () => {
    if (!profile) return 0
    
    const today = new Date().toISOString().split('T')[0]
    const isNewDay = profile.last_generation_date !== today
    
    if (isNewDay) return 5
    
    return Math.max(0, 5 - profile.daily_generation_count)
  }

  const canGenerate = getRemainingGenerations() > 0 || profile?.is_pro_member

  const handleGenerate = async () => {
    if (!prompt.trim() || !canGenerate || !user) return

    setLoading(true)
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt }
      })

      if (error) throw error

      setResult({
        text: data.generated_text,
        imageUrl: data.generated_image_url
      })

      // Update daily count
      await updateDailyCount()
    } catch (error) {
      console.error('Error generating content:', error)
      // Show error message
      alert('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Generate Amazing Content
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Describe what you want to create and let AI do the magic
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            {getRemainingGenerations()}/5 generations remaining today
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Describe your content
              </label>
              <div className="mt-1">
                <textarea
                  id="prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Example: Create a blog post about sustainable living with tips for reducing waste..."
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Be specific about what you want to create. Include style, tone, and any specific requirements.
              </p>
            </div>

            {!canGenerate && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Daily limit reached
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>
                        You've used all your daily generations. Upgrade to Pro for unlimited access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !canGenerate || loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="-ml-1 mr-3 h-5 w-5" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6"
          >
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Generated Content
            </h2>
            
            {result.imageUrl && (
              <div className="mb-6">
                <img
                  src={result.imageUrl}
                  alt="Generated image"
                  className="w-full max-w-md mx-auto rounded-lg shadow"
                />
              </div>
            )}
            
            <div className="prose dark:prose-invert max-w-none">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                  {result.text}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

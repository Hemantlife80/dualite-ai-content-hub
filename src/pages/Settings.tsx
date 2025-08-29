import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Key, Save, Trash2, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabase'

export function Settings() {
  const { user, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase.functions.invoke('handle-api-key', {
        body: { 
          action: 'save',
          apiKey: apiKey.trim()
        }
      })

      if (error) throw error
      
      setApiKey('')
      alert('API key saved successfully!')
    } catch (error) {
      console.error('Error saving API key:', error)
      alert('Failed to save API key. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API key?')) return

    try {
      const { error } = await supabase.functions.invoke('handle-api-key', {
        body: { action: 'delete' }
      })

      if (error) throw error
      
      alert('API key deleted successfully!')
    } catch (error) {
      console.error('Error deleting API key:', error)
      alert('Failed to delete API key. Please try again.')
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your account preferences and API configuration
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Profile Information
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.user_metadata?.full_name || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Appearance
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dark Mode
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Toggle between light and dark themes
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 bg-gray-200 dark:bg-indigo-600"
                >
                  <span className="sr-only">Toggle dark mode</span>
                  <span
                    className={`${
                      isDark ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  >
                    <span
                      className={`${
                        isDark ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                      } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                    >
                      <Sun className="h-3 w-3 text-gray-400" />
                    </span>
                    <span
                      className={`${
                        isDark ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                      } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                    >
                      <Moon className="h-3 w-3 text-indigo-600" />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* API Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                API Configuration
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure your AI model API key for content generation
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    OpenAI API Key
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex flex-grow items-stretch focus-within:z-10">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="api-key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="sk-..."
                      />
                    </div>
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKey.trim() || saving}
                      className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Your API key is encrypted and stored securely. You can get one from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      API key is encrypted and secure
                    </span>
                  </div>
                  <button
                    onClick={handleDeleteApiKey}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete API Key
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Account Actions
              </h2>
            </div>
            <div className="px-6 py-4">
              <button
                onClick={signOut}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

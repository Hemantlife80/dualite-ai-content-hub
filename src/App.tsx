import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './components/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { Generate } from './pages/Generate'
import { MyCreations } from './pages/MyCreations'
import { Settings } from './pages/Settings'
import { useAuth } from './hooks/useAuth'

/**
 * A wrapper for authenticated routes that provides the main application layout.
 */
const ProtectedRoutes = () => (
  <Layout>
    <Outlet />
  </Layout>
)

/**
 * This component handles the conditional rendering based on the authentication state.
 * It ensures that the correct set of routes is available.
 */
function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {user ? (
        // Routes available only to authenticated users
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/my-creations" element={<MyCreations />} />
          <Route path="/settings" element={<Settings />} />
          {/* Redirect any other path to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        // Routes available to unauthenticated users
        <>
          <Route path="/login" element={<LoginPage />} />
          {/* Redirect any other path to the login page */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  )
}

/**
 * The main App component that wraps the entire application within the Router.
 * This ensures the routing context is always available, which is critical for
 * handling authentication redirects from providers like Supabase.
 */
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App

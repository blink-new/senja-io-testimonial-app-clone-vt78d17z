import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import Navigation from './components/layout/Navigation'
import LoadingSpinner from './components/ui/LoadingSpinner'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import TestimonialCollection from './pages/TestimonialCollection'
import TestimonialManagement from './pages/TestimonialManagement'
import WallOfLove from './pages/WallOfLove'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import PublicForm from './pages/PublicForm'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/form/:formId" element={<PublicForm />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <>
              {user && <Navigation />}
              <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/collect" element={user ? <TestimonialCollection /> : <Navigate to="/" />} />
                <Route path="/manage" element={user ? <TestimonialManagement /> : <Navigate to="/" />} />
                <Route path="/wall" element={user ? <WallOfLove /> : <Navigate to="/" />} />
                <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
                <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
              </Routes>
            </>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
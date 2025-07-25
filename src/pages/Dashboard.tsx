import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blink } from '../blink/client'
import { MessageSquare, Star, TrendingUp, Users, Plus, Eye } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface DashboardStats {
  totalTestimonials: number
  pendingApproval: number
  averageRating: number
  totalViews: number
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalTestimonials: 0,
    pendingApproval: 0,
    averageRating: 0,
    totalViews: 0
  })
  const [recentTestimonials, setRecentTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async (userId: string) => {
    try {
      // Load testimonials
      const testimonials = await blink.db.testimonials.list({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        limit: 5
      })

      // Calculate stats
      const totalTestimonials = testimonials.length
      const pendingApproval = testimonials.filter(t => t.status === 'pending').length
      const approvedTestimonials = testimonials.filter(t => t.status === 'approved')
      const averageRating = approvedTestimonials.length > 0 
        ? approvedTestimonials.reduce((sum, t) => sum + parseFloat(t.rating || '5'), 0) / approvedTestimonials.length
        : 0

      setStats({
        totalTestimonials,
        pendingApproval,
        averageRating: Math.round(averageRating * 10) / 10,
        totalViews: Math.floor(Math.random() * 1000) + 500 // Mock data
      })

      setRecentTestimonials(testimonials)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadDashboardData(state.user.id)
      }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your testimonials.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Testimonials</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTestimonials}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/collect"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Plus className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Create Collection Form</h3>
                <p className="text-gray-600">Set up a new form to collect testimonials</p>
              </div>
            </div>
          </Link>

          <Link
            to="/manage"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Testimonials</h3>
                <p className="text-gray-600">Review and organize your testimonials</p>
              </div>
            </div>
          </Link>

          <Link
            to="/wall"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">View Wall of Love</h3>
                <p className="text-gray-600">See your testimonials in action</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Testimonials */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Testimonials</h2>
          </div>
          <div className="p-6">
            {recentTestimonials.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials yet</h3>
                <p className="text-gray-600 mb-4">Start collecting testimonials from your customers</p>
                <Link
                  to="/collect"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collection Form
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                          {testimonial.company && (
                            <span className="ml-2 text-sm text-gray-500">at {testimonial.company}</span>
                          )}
                          <div className="ml-auto flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < parseFloat(testimonial.rating || '5')
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{testimonial.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(testimonial.created_at).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            testimonial.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {testimonial.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Star, Check, X, Eye } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function TestimonialManagement() {
  const [user, setUser] = useState<any>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const loadTestimonials = async (userId: string) => {
    try {
      const userTestimonials = await blink.db.testimonials.list({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      })
      setTestimonials(userTestimonials)
    } catch (error) {
      console.error('Error loading testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadTestimonials(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  const handleApprove = async (testimonialId: string) => {
    try {
      await blink.db.testimonials.update(testimonialId, {
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      setTestimonials(testimonials.map(t => 
        t.id === testimonialId ? { ...t, status: 'approved' } : t
      ))
    } catch (error) {
      console.error('Error approving testimonial:', error)
    }
  }

  const handleReject = async (testimonialId: string) => {
    try {
      await blink.db.testimonials.update(testimonialId, {
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      setTestimonials(testimonials.map(t => 
        t.id === testimonialId ? { ...t, status: 'rejected' } : t
      ))
    } catch (error) {
      console.error('Error rejecting testimonial:', error)
    }
  }

  const filteredTestimonials = testimonials.filter(t => {
    if (filter === 'all') return true
    return t.status === filter
  })

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Testimonial Management</h1>
          <p className="text-gray-600">Review and manage your testimonials</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Testimonials List */}
        <div className="space-y-4">
          {filteredTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    {testimonial.company && (
                      <span className="ml-2 text-sm text-gray-500">at {testimonial.company}</span>
                    )}
                    <div className="ml-4 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < parseFloat(testimonial.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{testimonial.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {new Date(testimonial.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">{testimonial.email}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      testimonial.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : testimonial.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {testimonial.status}
                    </span>
                  </div>
                </div>
                {testimonial.status === 'pending' && (
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleApprove(testimonial.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(testimonial.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTestimonials.length === 0 && (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No testimonials have been submitted yet'
                : `No ${filter} testimonials found`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
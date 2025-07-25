import React, { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Plus, Copy, ExternalLink } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function TestimonialCollection() {
  const [user, setUser] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allow_video: true,
    require_approval: true
  })

  const loadForms = async (userId: string) => {
    try {
      const userForms = await blink.db.testimonial_forms.list({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      })
      setForms(userForms)
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadForms(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const formId = `form_${Date.now()}`
      await blink.db.testimonial_forms.create({
        id: formId,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        questions: JSON.stringify([]),
        allow_video: formData.allow_video ? "1" : "0",
        require_approval: formData.require_approval ? "1" : "0",
        brand_color: '#4F46E5',
        company_name: '',
        company_logo: '',
        is_active: "1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        allow_video: true,
        require_approval: true
      })
      loadForms(user.id)
    } catch (error) {
      console.error('Error creating form:', error)
      alert('Error creating form')
    }
  }

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`
    navigator.clipboard.writeText(link)
    alert('Form link copied to clipboard!')
  }

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Testimonial Collection</h1>
            <p className="text-gray-600">Create and manage forms to collect testimonials</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Collection Form</h2>
              <form onSubmit={handleCreateForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Share your experience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell us about your experience with our product"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allow_video}
                      onChange={(e) => setFormData({ ...formData, allow_video: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow video testimonials</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.require_approval}
                      onChange={(e) => setFormData({ ...formData, require_approval: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Require approval before publishing</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Forms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{form.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  Number(form.is_active) > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {Number(form.is_active) > 0 ? 'Active' : 'Inactive'}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyFormLink(form.id)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`/form/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Open form"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {forms.length === 0 && (
          <div className="text-center py-12">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="text-gray-600 mb-4">Create your first testimonial collection form</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
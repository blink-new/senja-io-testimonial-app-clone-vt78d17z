import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { blink } from '../blink/client'
import { Star, Send, Upload, Video } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface FormSettings {
  id: string
  user_id: string
  title: string
  description: string
  questions: string[]
  allow_video: boolean
  require_approval: boolean
  brand_color: string
  company_name: string
  company_logo: string
}

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>()
  const [formSettings, setFormSettings] = useState<FormSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    rating: 5,
    content: '',
    video_url: '',
    image_url: ''
  })

  useEffect(() => {
    if (!formId) return

    const loadFormSettings = async () => {
      try {
        const forms = await blink.db.testimonial_forms.list({
          where: { id: formId },
          limit: 1
        })

        if (forms.length > 0) {
          const form = forms[0]
          setFormSettings({
            ...form,
            questions: form.questions ? JSON.parse(form.questions) : []
          })
        }
      } catch (error) {
        console.error('Error loading form settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFormSettings()
  }, [formId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formSettings) return

    setSubmitting(true)
    try {
      await blink.db.testimonials.create({
        id: `testimonial_${Date.now()}`,
        user_id: formSettings.user_id,
        form_id: formId!,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        rating: formData.rating.toString(),
        content: formData.content,
        video_url: formData.video_url,
        image_url: formData.image_url,
        status: formSettings.require_approval ? 'pending' : 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      alert('Error submitting testimonial. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `testimonials/${type}s/${Date.now()}_${file.name}`,
        { upsert: true }
      )

      if (type === 'image') {
        setFormData({ ...formData, image_url: publicUrl })
      } else {
        setFormData({ ...formData, video_url: publicUrl })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!formSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
          <p className="text-gray-600">The testimonial form you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your testimonial has been submitted successfully. 
            {formSettings.require_approval && ' It will be reviewed before being published.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Submit Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200 text-center">
            {formSettings.company_logo && (
              <img
                src={formSettings.company_logo}
                alt={formSettings.company_name}
                className="h-12 mx-auto mb-4"
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formSettings.title}
            </h1>
            <p className="text-gray-600">
              {formSettings.description}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (Optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`p-1 ${
                      star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Testimonial Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Testimonial *
              </label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Share your experience..."
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photo (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'image')
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </label>
                  {formData.image_url && (
                    <span className="text-sm text-green-600">✓ Uploaded</span>
                  )}
                </div>
              </div>

              {formSettings.allow_video && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Video (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'video')
                      }}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Choose Video
                    </label>
                    {formData.video_url && (
                      <span className="text-sm text-green-600">✓ Uploaded</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: formSettings.brand_color }}
                className="flex items-center px-8 py-3 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              >
                {submitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {submitting ? 'Submitting...' : 'Submit Testimonial'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
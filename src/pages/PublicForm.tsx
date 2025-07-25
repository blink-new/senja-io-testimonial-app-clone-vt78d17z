import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { blink } from '../blink/client'
import { Star, Send, Upload, Video, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface FormField {
  id: string
  field_type: string
  label: string
  placeholder: string
  required: boolean
  options: string[]
  order_index: number
}

interface FormSettings {
  id: string
  user_id: string
  title: string
  description: string
  settings: any
}

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>()
  const [formSettings, setFormSettings] = useState<FormSettings | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({
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

    const loadFormData = async () => {
      try {
        setError(null)
        
        // Load form settings
        const forms = await blink.db.testimonial_forms.list({
          where: { id: formId },
          limit: 1
        })

        if (forms.length === 0) {
          setError('Form not found')
          setLoading(false)
          return
        }

        const form = forms[0]
        setFormSettings({
          ...form,
          settings: form.settings ? JSON.parse(form.settings) : {}
        })

        // Load custom fields
        const fields = await blink.db.form_fields.list({
          where: { form_id: formId },
          orderBy: { order_index: 'asc' }
        })

        setFormFields(fields.map(field => ({
          ...field,
          required: Number(field.required) > 0,
          options: field.options ? JSON.parse(field.options) : []
        })))

      } catch (error) {
        console.error('Error loading form data:', error)
        setError('Failed to load form. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadFormData()
  }, [formId])

  const validateForm = () => {
    // Check required default fields
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.content.trim()) {
      setError('Testimonial content is required')
      return false
    }

    // Check required custom fields
    for (const field of formFields) {
      if (field.required) {
        const value = formData[field.id]
        if (!value || (Array.isArray(value) && value.length === 0) || value.toString().trim() === '') {
          setError(`${field.label} is required`)
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formSettings) return

    setError(null)
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      // Prepare custom fields data
      const customFieldsData: Record<string, any> = {}
      formFields.forEach(field => {
        if (formData[field.id] !== undefined) {
          customFieldsData[field.id] = formData[field.id]
        }
      })

      const testimonialData = {
        id: `testimonial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: formSettings.user_id,
        form_id: formId!,
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company?.trim() || '',
        rating: formData.rating.toString(),
        content: formData.content.trim(),
        video_url: formData.video_url || '',
        image_url: formData.image_url || '',
        custom_fields: JSON.stringify(customFieldsData),
        status: formSettings.settings?.require_approval ? 'pending' : 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Submitting testimonial:', testimonialData)

      await blink.db.testimonials.create(testimonialData)

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      setError('Failed to submit testimonial. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    try {
      setError(null)
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
      setError('Failed to upload file. Please try again.')
    }
  }

  const renderCustomField = (field: FormField) => {
    const value = formData[field.id] || ''
    
    const updateFieldValue = (newValue: any) => {
      setFormData({ ...formData, [field.id]: newValue })
    }

    switch (field.field_type) {
      case 'text':
      case 'email':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.field_type}
              required={field.required}
              value={value}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              required={field.required}
              value={value}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              required={field.required}
              value={value}
              onChange={(e) => updateFieldValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : []
                      if (e.target.checked) {
                        updateFieldValue([...currentValues, option])
                      } else {
                        updateFieldValue(currentValues.filter(v => v !== option))
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'rating':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateFieldValue(star)}
                  className={`p-1 ${
                    star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {value || 0} star{value !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )

      default:
        return null
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
            {formSettings.settings?.require_approval && ' It will be reviewed before being published.'}
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
            {formSettings.settings?.company_logo && (
              <img
                src={formSettings.settings.company_logo}
                alt={formSettings.settings.company_name}
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

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Default Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
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
                  Email Address <span className="text-red-500">*</span>
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

            {/* Default Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating <span className="text-red-500">*</span>
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

            {/* Custom Fields */}
            {formFields.map(field => renderCustomField(field))}

            {/* Default Testimonial Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Testimonial <span className="text-red-500">*</span>
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

              {formSettings.settings?.allow_video && (
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
                style={{ backgroundColor: formSettings.settings?.brand_color || '#4F46E5' }}
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
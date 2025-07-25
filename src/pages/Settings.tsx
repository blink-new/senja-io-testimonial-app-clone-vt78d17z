import React, { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Settings as SettingsIcon, Save, User, Palette, Code } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface UserSettings {
  id: string
  user_id: string
  company_name: string
  company_logo: string
  brand_color: string
  custom_css: string
  email_notifications: boolean
  created_at: string
  updated_at: string
}

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo: '',
    brand_color: '#4F46E5',
    custom_css: '',
    email_notifications: true
  })

  const loadSettings = async (userId: string) => {
    try {
      const userSettings = await blink.db.user_settings.list({
        where: { user_id: userId },
        limit: 1
      })

      if (userSettings.length > 0) {
        const setting = userSettings[0]
        setSettings(setting)
        setFormData({
          company_name: setting.company_name || '',
          company_logo: setting.company_logo || '',
          brand_color: setting.brand_color || '#4F46E5',
          custom_css: setting.custom_css || '',
          email_notifications: Number(setting.email_notifications) > 0
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadSettings(state.user.id)
      }
    })
    return unsubscribe
  }, [])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const settingsData = {
        user_id: user.id,
        company_name: formData.company_name,
        company_logo: formData.company_logo,
        brand_color: formData.brand_color,
        custom_css: formData.custom_css,
        email_notifications: formData.email_notifications ? "1" : "0",
        updated_at: new Date().toISOString()
      }

      if (settings) {
        await blink.db.user_settings.update(settings.id, settingsData)
      } else {
        await blink.db.user_settings.create({
          id: `settings_${Date.now()}`,
          ...settingsData,
          created_at: new Date().toISOString()
        })
      }

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <SettingsIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Profile Settings */}
            <div>
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.company_logo}
                    onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Branding Settings */}
            <div>
              <div className="flex items-center mb-4">
                <Palette className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Branding</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.brand_color}
                      onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.brand_color}
                      onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.email_notifications}
                      onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom CSS */}
            <div>
              <div className="flex items-center mb-4">
                <Code className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Custom CSS</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom CSS for Testimonial Widgets
                </label>
                <textarea
                  value={formData.custom_css}
                  onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder=".testimonial-widget { /* Your custom styles */ }"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
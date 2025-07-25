import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Plus, Trash2, GripVertical, Edit3, Save, X } from 'lucide-react'

interface FormField {
  id: string
  field_type: string
  label: string
  placeholder: string
  required: boolean
  options: string[]
  order_index: number
}

interface FormBuilderProps {
  formId: string
  onClose: () => void
  onSave: () => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'rating', label: 'Star Rating' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' }
]

export default function FormBuilder({ formId, onClose, onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [newField, setNewField] = useState({
    field_type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: ['']
  })

  const loadFields = useCallback(async () => {
    try {
      const formFields = await blink.db.form_fields.list({
        where: { form_id: formId },
        orderBy: { order_index: 'asc' }
      })
      setFields(formFields.map(field => ({
        ...field,
        required: Number(field.required) > 0,
        options: field.options ? JSON.parse(field.options) : []
      })))
    } catch (error) {
      console.error('Error loading fields:', error)
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    loadFields()
  }, [loadFields])

  const addField = async () => {
    if (!newField.label.trim()) return

    try {
      const fieldId = `field_${Date.now()}`
      const maxOrder = Math.max(...fields.map(f => f.order_index), -1)
      
      await blink.db.form_fields.create({
        id: fieldId,
        form_id: formId,
        field_type: newField.field_type,
        label: newField.label,
        placeholder: newField.placeholder,
        required: newField.required ? "1" : "0",
        options: JSON.stringify(newField.options.filter(opt => opt.trim())),
        order_index: maxOrder + 1
      })

      setNewField({
        field_type: 'text',
        label: '',
        placeholder: '',
        required: false,
        options: ['']
      })
      
      loadFields()
    } catch (error) {
      console.error('Error adding field:', error)
      alert('Error adding field')
    }
  }

  const updateField = async (fieldId: string, updates: Partial<FormField>) => {
    try {
      const updateData: any = { ...updates }
      if ('required' in updates) {
        updateData.required = updates.required ? "1" : "0"
      }
      if ('options' in updates) {
        updateData.options = JSON.stringify(updates.options)
      }
      
      await blink.db.form_fields.update(fieldId, updateData)
      loadFields()
      setEditingField(null)
    } catch (error) {
      console.error('Error updating field:', error)
      alert('Error updating field')
    }
  }

  const deleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return

    try {
      await blink.db.form_fields.delete(fieldId)
      loadFields()
    } catch (error) {
      console.error('Error deleting field:', error)
      alert('Error deleting field')
    }
  }

  const moveField = async (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(f => f.id === fieldId)
    if (currentIndex === -1) return
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return

    const newFields = [...fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(targetIndex, 0, movedField)

    // Update order_index for all fields
    try {
      for (let i = 0; i < newFields.length; i++) {
        await blink.db.form_fields.update(newFields[i].id, { order_index: i })
      }
      loadFields()
    } catch (error) {
      console.error('Error reordering fields:', error)
    }
  }

  const FieldEditor = ({ field }: { field: FormField }) => {
    const [editData, setEditData] = useState({
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      options: [...field.options]
    })

    const addOption = () => {
      setEditData({
        ...editData,
        options: [...editData.options, '']
      })
    }

    const updateOption = (index: number, value: string) => {
      const newOptions = [...editData.options]
      newOptions[index] = value
      setEditData({ ...editData, options: newOptions })
    }

    const removeOption = (index: number) => {
      const newOptions = editData.options.filter((_, i) => i !== index)
      setEditData({ ...editData, options: newOptions })
    }

    return (
      <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={editData.label}
              onChange={(e) => setEditData({ ...editData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={editData.placeholder}
              onChange={(e) => setEditData({ ...editData, placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(field.field_type === 'select' || field.field_type === 'checkbox') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              {editData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add Option
              </button>
            </div>
          )}

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editData.required}
              onChange={(e) => setEditData({ ...editData, required: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Required field</span>
          </label>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => updateField(field.id, editData)}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Form Builder</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Field */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Field</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Type
                </label>
                <select
                  value={newField.field_type}
                  onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {FIELD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Label
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter field label"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter placeholder text"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required field</span>
                </label>
              </div>
            </div>

            {(newField.field_type === 'select' || newField.field_type === 'checkbox') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                {newField.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newField.options]
                        newOptions[index] = e.target.value
                        setNewField({ ...newField, options: newOptions })
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = newField.options.filter((_, i) => i !== index)
                        setNewField({ ...newField, options: newOptions })
                      }}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setNewField({ ...newField, options: [...newField.options, ''] })}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Option
                </button>
              </div>
            )}

            <button
              onClick={addField}
              disabled={!newField.label.trim()}
              className="mt-4 flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </button>
          </div>

          {/* Existing Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
            
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No fields added yet. Add your first field above.
              </div>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 bg-white">
                  {editingField === field.id ? (
                    <FieldEditor field={field} />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{field.label}</span>
                            {field.required && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                            </span>
                          </div>
                          {field.placeholder && (
                            <p className="text-sm text-gray-500">{field.placeholder}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setEditingField(field.id)}
                          className="p-2 text-gray-500 hover:text-gray-700"
                          title="Edit field"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                          title="Delete field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSave()
              onClose()
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            Save Form
          </button>
        </div>
      </div>
    </div>
  )
}
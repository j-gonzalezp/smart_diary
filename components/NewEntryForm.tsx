'use client'

import React, { useState, FormEvent, ChangeEvent, useEffect, useCallback } from 'react'
import { Models } from 'node-appwrite'
import { createEntryAction, updateEntryAction } from '@/lib/actions/entries.actions'
import { Entry } from '@/lib/types'

type EntryDocument = Models.Document & Omit<Entry, 'userId'>
type EntryFormData = Omit<Entry, 'userId' | '$id' | '$createdAt' | '$updatedAt' | '$permissions'>

interface NewEntryFormProps {
  onActionComplete: () => void
  entryToEdit?: EntryDocument | null
  onCancelEdit?: () => void
}

const formatDateTimeLocal = (date: Date | string | undefined): string => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const getInitialDateTime = () => formatDateTimeLocal(new Date())

export const NewEntryForm = ({ onActionComplete, entryToEdit, onCancelEdit }: NewEntryFormProps) => {
  const isEditMode = !!entryToEdit
  const [formData, setFormData] = useState<Partial<EntryFormData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showEndTime, setShowEndTime] = useState(false)

  const resetForm = useCallback(() => {
    const initialStart = entryToEdit ? formatDateTimeLocal(entryToEdit.startDateTime) : getInitialDateTime()
    const initialEnd = entryToEdit?.endDateTime ? formatDateTimeLocal(entryToEdit.endDateTime) : ''
    setFormData({
      title: entryToEdit?.title || '',
      content: entryToEdit?.content || '',
      startDateTime: initialStart,
      endDateTime: initialEnd,
      isAllDay: entryToEdit?.isAllDay || false,
      status: entryToEdit?.status || 'planned',
    })
    setShowEndTime(!!initialEnd && !entryToEdit?.isAllDay)
    setError(null)
    setSuccessMessage(null)
  }, [entryToEdit])

  useEffect(() => {
    resetForm()
  }, [resetForm])

  useEffect(() => {
    if (formData.isAllDay) {
      setShowEndTime(false)
    } else if (formData.endDateTime) {
      setShowEndTime(true)
    }
  }, [formData.isAllDay, formData.endDateTime])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === 'checkbox'
    const newValue = isCheckbox ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
  }

  const handleShowEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const show = e.target.checked
    setShowEndTime(show)
    if (!show) {
      setFormData(prev => ({ ...prev, endDateTime: '' }))
    } else if (!formData.endDateTime && formData.startDateTime) {
      const startDate = new Date(formData.startDateTime)
      if (!isNaN(startDate.getTime())) {
        startDate.setHours(startDate.getHours() + 1)
        setFormData(prev => ({ ...prev, endDateTime: formatDateTimeLocal(startDate) }))
      }
    }
  }

  const handleSetTime = (type: 'start' | 'end' | 'both-now' | 'start-now-ongoing') => {
    const now = new Date()
    const nowLocalString = formatDateTimeLocal(now)
    if (type === 'start') {
      setFormData(prev => ({ ...prev, startDateTime: nowLocalString, isAllDay: false }))
    } else if (type === 'end') {
      if (!formData.isAllDay && showEndTime) {
        setFormData(prev => ({ ...prev, endDateTime: nowLocalString }))
      }
    } else if (type === 'both-now') {
      setFormData(prev => ({
        ...prev,
        startDateTime: nowLocalString,
        endDateTime: '',
        isAllDay: false,
        status: 'instantaneous'
      }))
      setShowEndTime(false)
    } else if (type === 'start-now-ongoing') {
      setFormData(prev => ({
        ...prev,
        startDateTime: nowLocalString,
        endDateTime: '',
        isAllDay: false,
        status: 'ongoing'
      }))
      setShowEndTime(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    if (!formData.title?.trim()) {
      setError('Title is required.')
      setIsLoading(false)
      return
    }
    if (!formData.startDateTime) {
      setError('Start date and time are required.')
      setIsLoading(false)
      return
    }

    let startDateTimeISO: string
    let endDateTimeISO: string | undefined = undefined

    try {
      startDateTimeISO = new Date(formData.startDateTime).toISOString()
    } catch {
      setError('Invalid Start Date/Time format.')
      setIsLoading(false)
      return
    }

    if (!formData.isAllDay && showEndTime && formData.endDateTime) {
      try {
        endDateTimeISO = new Date(formData.endDateTime).toISOString()
        if (startDateTimeISO >= endDateTimeISO) {
          setError('End time must be after start time.')
          setIsLoading(false)
          return
        }
      } catch {
        setError('Invalid End Date/Time format.')
        setIsLoading(false)
        return
      }
    }

    const dataPayload: EntryFormData = {
      title: formData.title,
      content: formData.content || '',
      startDateTime: startDateTimeISO,
      endDateTime: formData.isAllDay ? undefined : endDateTimeISO,
      isAllDay: formData.isAllDay || false,
      status: formData.status || 'planned',
    }

    try {
      let result: Models.Document | null = null
      if (isEditMode && entryToEdit) {
        result = await updateEntryAction(entryToEdit.$id, dataPayload)
        if (result) setSuccessMessage(`Entry "${result.title || 'Untitled'}" updated successfully!`)
      } else {
        result = await createEntryAction(dataPayload)
        if (result) setSuccessMessage(`Entry "${result.title || 'Untitled'}" created successfully!`)
      }

      if (result) {
        onActionComplete()
        if (!isEditMode) {
          resetForm()
        }
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} entry. Server action returned null.`)
      }
    } catch (err: any) {
      setError(err.message || `An unexpected error occurred during ${isEditMode ? 'update' : 'creation'}.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50 space-y-4 relative">
      <h2 className="text-lg font-medium">{isEditMode ? 'Edit Entry' : 'Create New Entry'}</h2>

      {error && <p className="text-red-600 bg-red-100 p-2 rounded text-sm">Error: {error}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-2 rounded text-sm">{successMessage}</p>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
        <input type="text" id="title" name="title" value={formData.title || ''} onChange={handleChange} required className="w-full input-class" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time*</label>
          <input type="datetime-local" id="startDateTime" name="startDateTime" value={formData.startDateTime || ''} onChange={handleChange} required className="w-full input-class" disabled={formData.isAllDay} />
          {!formData.isAllDay && <button type="button" onClick={() => handleSetTime('start')} className="text-xs text-indigo-600 hover:text-indigo-800 mt-1">Set Start to Now</button>}
        </div>

        <div className="flex items-center space-x-4 pt-4 md:pt-0 justify-start md:justify-end">
          <div className="flex items-center">
            <input id="isAllDay" name="isAllDay" type="checkbox" checked={formData.isAllDay || false} onChange={handleChange} className="checkbox-class" />
            <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-900">All Day</label>
          </div>
          {!formData.isAllDay && (
            <div className="flex items-center">
              <input id="showEndTimeToggle" name="showEndTimeToggle" type="checkbox" checked={showEndTime} onChange={handleShowEndTimeChange} className="checkbox-class" />
              <label htmlFor="showEndTimeToggle" className="ml-2 block text-sm text-gray-900">End Time</label>
            </div>
          )}
        </div>

        {showEndTime && !formData.isAllDay && (
          <div className="md:col-start-1">
            <label htmlFor="endDateTime" className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
            <input type="datetime-local" id="endDateTime" name="endDateTime" value={formData.endDateTime || ''} onChange={handleChange} className="w-full input-class" min={formData.startDateTime} />
            <button type="button" onClick={() => handleSetTime('end')} className="text-xs text-indigo-600 hover:text-indigo-800 mt-1">Set End to Now</button>
          </div>
        )}

        <div className={showEndTime && !formData.isAllDay ? "md:col-start-2" : "md:col-span-2"}>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" value={formData.status || 'planned'} onChange={handleChange} className="w-full input-class">
            <option value="planned">Planned</option>
            <option value="ongoing">Ongoing</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
            <option value="instantaneous">Instantaneous</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea id="content" name="content" value={formData.content || ''} onChange={handleChange} rows={4} className="w-full input-class" />
      </div>

      <div className="flex justify-between">
        {onCancelEdit && <button type="button" onClick={onCancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>}
        <button type="submit" disabled={isLoading} className="btn-class">{isLoading ? 'Saving...' : isEditMode ? 'Update Entry' : 'Create Entry'}</button>
      </div>
    </form>
  )
}

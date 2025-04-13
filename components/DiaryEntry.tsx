'use client'

import { Models } from 'node-appwrite'
import { Entry } from '../lib/types'
import { useState } from 'react'
import { deleteEntryAction } from '@/lib/actions/entries.actions'

type EntryDocument = Models.Document & Omit<Entry, 'userId'>

interface DiaryEntryProps {
  entry: EntryDocument
  onActionComplete: () => void
  onEdit: (entry: EntryDocument) => void
}

const formatDateTime = (isoString: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return String(isoString)
    return date.toLocaleString(undefined, options)
  } catch {
    return String(isoString)
  }
}

const formatDate = (isoString: string | Date): string =>
  formatDateTime(isoString, { year: 'numeric', month: 'long', day: 'numeric' })

const formatTime = (isoString: string | Date): string =>
  formatDateTime(isoString, { hour: '2-digit', minute: '2-digit' })

const renderTimeInfo = (entry: EntryDocument): string => {
  const { startDateTime, endDateTime, isAllDay, status } = entry
  const startDateStr = formatDate(startDateTime)
  const startTimeStr = formatTime(startDateTime)

  if (isAllDay) return `${startDateStr} (All Day)`

  if (status === 'instantaneous' || (!endDateTime && !status))
    return `${startDateStr} at ${startTimeStr}`

  if (endDateTime) {
    const endDateStr = formatDate(endDateTime)
    const endTimeStr = formatTime(endDateTime)
    if (startDateStr === endDateStr)
      return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`
    else
      return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`
  }

  if (status === 'ongoing') return `${startDateStr}, ${startTimeStr} (Ongoing)`

  return `${startDateStr}, ${startTimeStr}`
}

export const DiaryEntry = ({ entry, onActionComplete, onEdit }: DiaryEntryProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const title = entry.title || 'Untitled Entry'
  const content = entry.content || 'No content.'
  const timeDisplay = renderTimeInfo(entry)

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const success = await deleteEntryAction(entry.$id)
      if (success) onActionComplete()
      else setDeleteError('Failed to delete entry.')
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => onEdit(entry)

  return (
    <article className={`mb-6 p-4 border rounded-lg shadow-sm bg-white relative ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold mb-1">{title}</h2>
          <p className="text-sm text-gray-600 mb-3">
            {timeDisplay}
            {entry.status && ` [${entry.status}]`}
          </p>
        </div>
        <div className="flex space-x-2 flex-shrink-0 mt-1">
          <button
            onClick={handleEdit}
            className="px-2 py-1 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50"
            disabled={isDeleting}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      <p className="text-gray-800 whitespace-pre-wrap mt-2">{content}</p>
      <p className="text-xs text-gray-400 mt-3">ID: {entry.$id}</p>
      {deleteError && <p className="text-xs text-red-600 mt-2 absolute bottom-1 left-4">{deleteError}</p>}
    </article>
  )
}

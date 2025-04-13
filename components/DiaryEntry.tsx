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

const formatDateTime = (isoString: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
  if (!isoString) return 'N/A'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return String(isoString)
    return date.toLocaleString(undefined, options)
  } catch {
    return String(isoString)
  }
}

const formatDate = (isoString: string | Date | undefined | null): string =>
  formatDateTime(isoString, { year: 'numeric', month: 'long', day: 'numeric' })

const formatTime = (isoString: string | Date | undefined | null): string =>
  formatDateTime(isoString, { hour: '2-digit', minute: '2-digit', hour12: true })

const renderTimeInfo = (entry: EntryDocument): string => {
  const { startDateTime, endDateTime, isAllDay, status } = entry
  if (!startDateTime) return 'Date/Time not set'

  const startDateStr = formatDate(startDateTime)
  const startTimeStr = formatTime(startDateTime)

  if (isAllDay) return `${startDateStr} (All Day)`

  if (status === 'instantaneous' || (!endDateTime && !status)) {
    return `${startDateStr} at ${startTimeStr}`
  }

  if (endDateTime) {
    const endDateStr = formatDate(endDateTime)
    const endTimeStr = formatTime(endDateTime)
    if (startDateStr === endDateStr) {
      return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`
    } else {
      return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`
    }
  }

  if (status === 'ongoing') return `${startDateStr}, ${startTimeStr} (Ongoing)`

  return `${startDateStr}, ${startTimeStr}`
}

export const DiaryEntry = ({ entry, onActionComplete, onEdit }: DiaryEntryProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const title = entry.title || 'Untitled Entry'
  const content = entry.content || 'No content provided.'
  const timeDisplay = renderTimeInfo(entry)

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the entry titled "${title}"?`)) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const success = await deleteEntryAction(entry.$id)
      if (success) {
        onActionComplete()
      } else {
        setDeleteError('Failed to delete the entry. The server action reported failure.')
      }
    } catch (err: unknown) {
      let errorMessage = 'An unexpected error occurred during deletion.'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      setDeleteError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    onEdit(entry)
  }

  return (
    <article className={`mb-6 p-4 border rounded-lg shadow-sm bg-white transition-opacity duration-300 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold mb-1 break-words">{title}</h2>
          <p className="text-sm text-gray-600 mb-3">
            {timeDisplay}
            {entry.status && entry.status !== 'instantaneous' && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                {entry.status}
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2 flex-shrink-0 mt-1">
          <button
            onClick={handleEdit}
            className="px-2 py-1 text-xs font-medium border border-blue-300 text-blue-600 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
            aria-label={`Edit entry titled ${title}`}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-2 py-1 text-xs font-medium border border-red-300 text-red-600 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Delete entry titled ${title}`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <p className="text-gray-800 whitespace-pre-wrap mt-2 break-words">{content}</p>

      <div className="mt-3 flex justify-between items-center">
        <p className="text-xs text-gray-400">ID: {entry.$id}</p>
        {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
      </div>
    </article>
  )
}

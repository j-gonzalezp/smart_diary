'use client'

import { useState, useCallback } from 'react'
import { Models } from 'node-appwrite'
import { NewEntryForm } from '@/components/NewEntryForm'
import { EntryList } from '@/components/EntryList'
import { Entry } from '@/lib/types'

type EntryDocument = Models.Document & Omit<Entry, 'userId'>

export default function EntriesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [entryToEdit, setEntryToEdit] = useState<EntryDocument | null>(null)

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1)
    setEntryToEdit(null)
  }, [])

  const handleEditEntry = useCallback((entry: EntryDocument) => {
    setEntryToEdit(entry)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEntryToEdit(null)
  }, [])

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Manage Entries</h1>
        <p className="text-gray-600 mt-1">Create, view, edit, and delete your diary entries.</p>
      </header>

      <section className="bg-white p-6 rounded-lg shadow">
        <NewEntryForm
          key={entryToEdit ? entryToEdit.$id : 'create'}
          onActionComplete={triggerRefresh}
          entryToEdit={entryToEdit}
          onCancelEdit={handleCancelEdit}
        />
      </section>

      <section>
        <EntryList
          refreshTrigger={refreshKey}
          onActionComplete={triggerRefresh}
          onEditEntry={handleEditEntry}
        />
      </section>
    </div>
  )
}

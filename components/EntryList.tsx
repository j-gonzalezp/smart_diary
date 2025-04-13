// src/components/EntryList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Models } from 'node-appwrite';
import { listEntriesAction } from '@/lib/actions/entries.actions';
import { DiaryEntry } from './DiaryEntry';
import { Entry } from '@/lib/types';

// Ensure EntryDocument is defined or imported
type EntryDocument = Models.Document & Omit<Entry, 'userId'>;

interface EntryListProps {
    refreshTrigger: number;
    onActionComplete: () => void; // For refresh after delete or manual refresh
    onEditEntry: (entry: EntryDocument) => void; // Handler to pass down for editing
}

export const EntryList = ({ refreshTrigger, onActionComplete, onEditEntry }: EntryListProps) => {
  const [entries, setEntries] = useState<EntryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Callback to fetch entries
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEntries = await listEntriesAction();
      setEntries(fetchedEntries as EntryDocument[]);
    } catch (err: any) {
      console.error('Error fetching entries:', err); // Keep console log for debugging
      setError(err.message || 'Failed to load entries.');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed, fetch logic is self-contained

  // Effect to re-fetch when refreshTrigger changes
  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger, fetchEntries]); // Depend on trigger and the stable fetch function

  // Render loading/error states
  if (isLoading) return <div className="text-center p-4">Loading entries...</div>;
  if (error) return <div className="text-center p-4 text-red-600">Error: {error}</div>;

  // Render the list
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-2xl font-semibold">Your Entries</h2>
         {/* Refresh button uses the onActionComplete handler passed from the page */}
         <button
            onClick={onActionComplete}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
             Refresh List
         </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-gray-500 italic">No entries found.</p>
      ) : (
        <div className="space-y-4">
          {/* Map through entries and render DiaryEntry, passing necessary props */}
          {entries.map((entry) => (
            <DiaryEntry
                key={entry.$id}
                entry={entry}
                onActionComplete={onActionComplete} // Pass down refresh handler
                onEdit={onEditEntry}             // Pass down edit handler
            />
          ))}
        </div>
      )}
    </div>
  );
};
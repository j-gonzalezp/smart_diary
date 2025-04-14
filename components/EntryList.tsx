'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Models } from 'appwrite';
import { listEntriesAction } from '@/lib/actions/entries.actions';
import { DiaryEntry } from './DiaryEntry';
import { Entry } from '@/lib/types';

type EntryDocument = Models.Document & Omit<Entry, 'userId'>;

interface EntryListProps {
  refreshTrigger: number;
  onActionComplete: () => void;
  onEditEntry: (entry: EntryDocument) => void;
}

export const EntryList = ({ refreshTrigger, onActionComplete, onEditEntry }: EntryListProps) => {
  const [entries, setEntries] = useState<EntryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEntries = await listEntriesAction();

      if (Array.isArray(fetchedEntries)) {
        setEntries(fetchedEntries as EntryDocument[]);
      } else {
        setEntries([]);
        setError("Received unexpected data format from server.");
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unknown error occurred while fetching entries.');
      }
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger, fetchEntries]);

  if (isLoading) {
    return <div className="text-center p-4 animate-pulse">Loading entries...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600 border border-red-300 rounded-md bg-red-50">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Your Entries</h2>
        <button
          onClick={onActionComplete}
          className="px-4 py-2 border border-indigo-600 rounded-md text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 ease-in-out"
          aria-label="Refresh entry list"
        >
          Refresh List
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">No entries found. Start writing buddy!</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.$id}>
              <DiaryEntry
                entry={entry}
                onActionComplete={onActionComplete}
                onEdit={onEditEntry}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

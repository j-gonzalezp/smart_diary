'use client'

import React, { useState, FormEvent, ChangeEvent, useEffect, useCallback } from 'react'
import { Models } from 'appwrite'
import { createEntryAction, updateEntryAction } from '@/lib/actions/entries.actions'
import { Entry } from '@/lib/types'

type EntryDocument = Models.Document & Omit<Entry, 'userId'>;

type EntryFormData = Omit<Entry, 'userId' | '$id' | '$createdAt' | '$updatedAt' | '$permissions'>;

interface NewEntryFormProps {
  onActionComplete: () => void;
  entryToEdit?: EntryDocument | null;
  onCancelEdit?: () => void;
}

const formatDateTimeLocal = (date: Date | string | undefined): string => {
  const defaultDate = new Date();
  let d: Date;

  if (date instanceof Date) {
    d = isNaN(date.getTime()) ? defaultDate : date;
  } else if (typeof date === 'string') {
    const parsed = new Date(date);
    d = isNaN(parsed.getTime()) ? defaultDate : parsed;
  } else {
    d = defaultDate;
  }

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getInitialDateTime = () => formatDateTimeLocal(new Date());

export const NewEntryForm = ({ onActionComplete, entryToEdit, onCancelEdit }: NewEntryFormProps) => {
  const isEditMode = !!entryToEdit;

  const [formData, setFormData] = useState<Partial<EntryFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEndTime, setShowEndTime] = useState(false);

  const resetForm = useCallback(() => {
    const initialStart = entryToEdit?.startDateTime ? formatDateTimeLocal(entryToEdit.startDateTime) : getInitialDateTime();
    const initialEnd = entryToEdit?.endDateTime ? formatDateTimeLocal(entryToEdit.endDateTime) : '';

    setFormData({
      title: entryToEdit?.title || '',
      content: entryToEdit?.content || '',
      startDateTime: initialStart,
      endDateTime: initialEnd,
      isAllDay: entryToEdit?.isAllDay || false,
      status: entryToEdit?.status || 'planned',
    });
    setShowEndTime(!!initialEnd && !(entryToEdit?.isAllDay || false));
    setError(null);
    setSuccessMessage(null);
  }, [entryToEdit]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (formData.isAllDay) {
      setShowEndTime(false);
    } else if (formData.endDateTime) {
      setShowEndTime(true);
    }
  }, [formData.isAllDay, formData.endDateTime]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };
/*
  const handleShowEndTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const show = e.target.checked;
    setShowEndTime(show);
    if (!show) {
      setFormData(prev => ({ ...prev, endDateTime: '' }));
    } else if (!formData.endDateTime && formData.startDateTime) {
      try {
        const startDate = new Date(formData.startDateTime);
        if (!isNaN(startDate.getTime())) {
          startDate.setHours(startDate.getHours() + 1);
          setFormData(prev => ({ ...prev, endDateTime: formatDateTimeLocal(startDate) }));
        }
      } catch {}
    }
  };

  const handleSetTime = (type: 'start' | 'end' | 'both-now' | 'start-now-ongoing') => {
    const nowLocalString = formatDateTimeLocal(new Date());
    switch (type) {
      case 'start':
        setFormData(prev => ({ ...prev, startDateTime: nowLocalString, isAllDay: false }));
        break;
      case 'end':
        if (!formData.isAllDay && showEndTime) {
          setFormData(prev => ({ ...prev, endDateTime: nowLocalString }));
        }
        break;
      case 'both-now':
        setFormData(prev => ({
          ...prev,
          startDateTime: nowLocalString,
          endDateTime: '',
          isAllDay: false,
          status: 'instantaneous'
        }));
        setShowEndTime(false);
        break;
      case 'start-now-ongoing':
        setFormData(prev => ({
          ...prev,
          startDateTime: nowLocalString,
          endDateTime: '',
          isAllDay: false,
          status: 'ongoing'
        }));
        setShowEndTime(false);
        break;
    }
  };*/

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.title?.trim()) {
      setError('Title is required.');
      setIsLoading(false);
      return;
    }
    if (!formData.startDateTime) {
      setError('Start date and time are required.');
      setIsLoading(false);
      return;
    }

    let startDateTimeISO: string;
    let endDateTimeISO: string | undefined = undefined;

    try {
      startDateTimeISO = new Date(formData.startDateTime).toISOString();
    } catch {
      setError('Invalid Start Date/Time format.');
      setIsLoading(false);
      return;
    }

    if (!formData.isAllDay && showEndTime && formData.endDateTime) {
      try {
        endDateTimeISO = new Date(formData.endDateTime).toISOString();
        if (startDateTimeISO >= endDateTimeISO) {
          setError('End time must be after start time.');
          setIsLoading(false);
          return;
        }
      } catch {
        setError('Invalid End Date/Time format.');
        setIsLoading(false);
        return;
      }
    }

    const dataPayload: EntryFormData = {
      title: formData.title,
      content: formData.content || '',
      startDateTime: startDateTimeISO,
      endDateTime: formData.isAllDay ? undefined : endDateTimeISO,
      isAllDay: formData.isAllDay || false,
      status: formData.status || 'planned',
    };

    try {
      let result: Models.Document | null = null;

      if (isEditMode && entryToEdit) {
        result = await updateEntryAction(entryToEdit.$id, dataPayload);
        if (result) {
          setSuccessMessage(`Entry "${result.title || 'Untitled'}" updated successfully!`);
        }
      } else {
        result = await createEntryAction(dataPayload);
        if (result) {
          setSuccessMessage(`Entry "${result.title || 'Untitled'}" created successfully!`);
        }
      }

      if (result) {
        onActionComplete();
        if (!isEditMode) {
          resetForm();
        }
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} entry.`);
      }

    } catch (err: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} entry:`, err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError(`An unexpected error occurred.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const checkboxClass = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const btnClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50";
  const cancelBtnClass = "py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-white shadow space-y-6 relative">
      <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? 'Edit Entry' : 'Create New Entry'}</h2>
      {error && <div className="text-red-500">{error}</div>}
      {successMessage && <div className="text-green-500">{successMessage}</div>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title || ''}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content || ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="startDateTime" className="block text-sm font-medium text-gray-700">Start Date/Time</label>
          <input
            id="startDateTime"
            name="startDateTime"
            type="datetime-local"
            value={formData.startDateTime || ''}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        {!formData.isAllDay && showEndTime && (
          <div>
            <label htmlFor="endDateTime" className="block text-sm font-medium text-gray-700">End Date/Time</label>
            <input
              id="endDateTime"
              name="endDateTime"
              type="datetime-local"
              value={formData.endDateTime || ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="isAllDay" className="flex items-center text-sm font-medium text-gray-700">
            <input
              id="isAllDay"
              name="isAllDay"
              type="checkbox"
              checked={formData.isAllDay || false}
              onChange={handleChange}
              className={checkboxClass}
            />
            <span className="ml-2">All Day</span>
          </label>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status || 'planned'}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="planned">Planned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        {onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className={cancelBtnClass}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={btnClass}
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update Entry' : 'Create Entry'}
        </button>
      </div>
    </form>
  );
};

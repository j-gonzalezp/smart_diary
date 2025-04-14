import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EntryList } from './EntryList'
import * as entryActions from '@/lib/actions/entries.actions'
import { Models } from 'appwrite'
import { appwriteConfig } from '@/lib/appwrite/config'
import { Entry } from '@/lib/types'

type EntryDocument = Models.Document & Omit<Entry, 'userId'>

jest.mock('@/lib/actions/entries.actions', () => ({
  listEntriesAction: jest.fn()
}))

const mockListEntriesAction = entryActions.listEntriesAction as jest.Mock

describe('EntryList Component', () => {
  const mockEntriesData: EntryDocument[] = [
    {
      $id: 'entry-1',
      $createdAt: new Date('2024-01-10T10:00:00.000Z').toISOString(),
      $updatedAt: new Date('2024-01-10T10:30:00.000Z').toISOString(),
      $permissions: ['read("user:USER_ID")'],
      $databaseId: appwriteConfig.databaseId,
      $collectionId: appwriteConfig.entriesCollectionId,
      title: "Reunión de Sincronización",
      content: 'Discutimos el progreso del sprint y los bloqueadores.',
      startDateTime: new Date('2024-01-10T10:00:00.000Z').toISOString(),
      endDateTime: new Date('2024-01-10T11:00:00.000Z').toISOString(),
      isAllDay: false,
      status: 'completed'
    },
    {
      $id: 'entry-2',
      $createdAt: new Date('2024-01-11T09:00:00.000Z').toISOString(),
      $updatedAt: new Date('2024-01-11T09:00:00.000Z').toISOString(),
      $permissions: ['read("user:USER_ID")'],
      $databaseId: appwriteConfig.databaseId,
      $collectionId: appwriteConfig.entriesCollectionId,
      title: "Planificación Vacaciones",
      content: 'Investigar destinos y vuelos para las vacaciones de verano.',
      startDateTime: new Date('2024-01-11T00:00:00.000Z').toISOString(),
      isAllDay: true
    },
    {
      $id: 'entry-3',
      $createdAt: new Date('2024-01-12T15:00:00.000Z').toISOString(),
      $updatedAt: new Date('2024-01-12T15:00:00.000Z').toISOString(),
      $permissions: ['read("user:USER_ID")'],
      $databaseId: appwriteConfig.databaseId,
      $collectionId: appwriteConfig.entriesCollectionId,
      title: "Idea Rápida App",
      content: 'Anotar idea sobre app de seguimiento de hábitos.',
      startDateTime: new Date('2024-01-12T15:00:00.000Z').toISOString(),
      isAllDay: false,
      status: 'instantaneous'
    }
  ]

  const mockOnActionComplete = jest.fn()
  const mockOnEditEntry = jest.fn()
  const mockProps = {
    refreshTrigger: 0,
    onActionComplete: mockOnActionComplete,
    onEditEntry: mockOnEditEntry
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display loading state initially', () => {
    mockListEntriesAction.mockImplementation(() => new Promise(() => {}))
    render(<EntryList {...mockProps} />)
    expect(screen.getByText(/loading entries.../i)).toBeInTheDocument()
    expect(mockListEntriesAction).toHaveBeenCalledTimes(1)
  })

  it('should display entries when fetch is successful', async () => {
    mockListEntriesAction.mockResolvedValue(mockEntriesData)
    render(<EntryList {...mockProps} />)
    const listItems = await screen.findAllByRole('listitem')
    expect(listItems).toHaveLength(mockEntriesData.length)
    expect(await screen.findByText('Discutimos el progreso del sprint y los bloqueadores.')).toBeInTheDocument()
    expect(await screen.findByText('Investigar destinos y vuelos para las vacaciones de verano.')).toBeInTheDocument()
    expect(await screen.findByText('Anotar idea sobre app de seguimiento de hábitos.')).toBeInTheDocument()
    expect(screen.queryByText(/loading entries.../i)).not.toBeInTheDocument()
    expect(screen.queryByText(/error:/i)).not.toBeInTheDocument()
    expect(mockListEntriesAction).toHaveBeenCalledTimes(1)
  })

  it('should display empty message when no entries are fetched', async () => {
    mockListEntriesAction.mockResolvedValue([])
    render(<EntryList {...mockProps} />)
    expect(await screen.findByText(/no entries found/i)).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.queryByText(/loading entries.../i)).not.toBeInTheDocument()
    expect(screen.queryByText(/error:/i)).not.toBeInTheDocument()
    expect(mockListEntriesAction).toHaveBeenCalledTimes(1)
  })

  it('should display error message when fetch fails', async () => {
    const errorMessage = 'Database connection failed'
    mockListEntriesAction.mockRejectedValue(new Error(errorMessage))
    render(<EntryList {...mockProps} />)
    const errorElement = await screen.findByText(new RegExp(`error: ${errorMessage}`, 'i'))
    expect(errorElement).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.queryByText(/loading entries.../i)).not.toBeInTheDocument()
    expect(mockListEntriesAction).toHaveBeenCalledTimes(1)
  })

  it('should call onActionComplete when the Refresh List button is clicked', async () => {
    mockListEntriesAction.mockResolvedValue([])
    render(<EntryList {...mockProps} />)
    await screen.findByText(/no entries found/i)
    const refreshButton = screen.getByRole('button', { name: /refresh entry list/i })
    fireEvent.click(refreshButton)
    expect(mockOnActionComplete).toHaveBeenCalledTimes(1)
  })
})
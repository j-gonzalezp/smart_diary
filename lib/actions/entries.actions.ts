// src/lib/actions/entries.ts
"use server"

import {
  AppwriteException,
  Databases,
  ID,
  Models,
  Query,
  Account
} from "node-appwrite"
import { createSessionClient } from "../appwrite"
import { appwriteConfig } from "../appwrite/config"
import { Entry } from "../types"

type CreateEntryData = Omit<Entry, 'userId' | '$id' | '$createdAt' | '$updatedAt' | '$permissions'>
type UpdateEntryData = Partial<Omit<Entry, 'userId' | '$id' | '$createdAt' | '$updatedAt' | '$permissions'>>

export const createEntryAction = async (entryData: CreateEntryData): Promise<Models.Document | null> => {
  if (!entryData.startDateTime) return null
  if (typeof entryData.isAllDay === 'undefined') return null
  if (entryData.endDateTime && entryData.startDateTime >= entryData.endDateTime) return null

  try {
    const { databases, account } = await createSessionClient()
    const user = await account.get()
    const userId = user.$id

    const dataToCreate = {
      ...entryData,
      userId
    }

    const document = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      ID.unique(),
      dataToCreate
    )

    return document
  } catch (error: any) {
    if (error instanceof AppwriteException) {
      console.error(`Appwrite Error: ${error.message} (Code: ${error.code}, Type: ${error.type})`)
    }
    return null
  }
}

export const getEntryAction = async (entryId: string): Promise<Models.Document | null> => {
  if (!entryId) return null

  try {
    const { databases } = await createSessionClient()
    const document = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      entryId
    )
    return document
  } catch (error: any) {
    if (error instanceof AppwriteException && error.code === 404) {
      console.warn(`Document ${entryId} not found or access denied.`)
    }
    return null
  }
}

export const listEntriesAction = async (): Promise<Models.Document[]> => {
  try {
    const { databases, account } = await createSessionClient()
    const user = await account.get()
    const userId = user.$id

    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('startDateTime')
      ]
    )

    return response.documents
  } catch (error: any) {
    if (error instanceof AppwriteException) {
      console.error(`Appwrite Error: ${error.message} (Code: ${error.code}, Type: ${error.type})`)
    }
    return []
  }
}

export const updateEntryAction = async (
  entryId: string,
  entryData: UpdateEntryData
): Promise<Models.Document | null> => {
  if (!entryId || !entryData || Object.keys(entryData).length === 0) return null

  if (entryData.startDateTime && entryData.endDateTime && entryData.startDateTime >= entryData.endDateTime) return null

  try {
    const { databases } = await createSessionClient()
    const document = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      entryId,
      entryData
    )
    return document
  } catch (error: any) {
    if (error instanceof AppwriteException && error.code === 404) {
      console.warn(`Document ${entryId} not found for update or access denied.`)
    }
    return null
  }
}

export const deleteEntryAction = async (entryId: string): Promise<boolean> => {
  if (!entryId) return false

  try {
    const { databases } = await createSessionClient()
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      entryId
    )
    return true
  } catch (error: any) {
    if (error instanceof AppwriteException && error.code === 404) {
      console.warn(`Document ${entryId} not found for deletion or access denied.`)
    }
    return false
  }
}

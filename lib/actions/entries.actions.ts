"use server"

import { AppwriteException, ID, Models, Query } from "node-appwrite";
import { createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { Entry } from "../types";

type CreateEntryData = Omit<Entry, 'userId' | '$id' | '$createdAt' | '$updatedAt' | '$permissions'>;
type UpdateEntryData = Partial<Omit<Entry, 'userId' | '$id' | '$createdAt' | '$updatedAt' | '$permissions'>>;

export const createEntryAction = async (entryData: CreateEntryData): Promise<Models.Document | null> => {
  if (!entryData.startDateTime || typeof entryData.isAllDay === 'undefined') {
    console.error("createEntryAction Error: startDateTime and isAllDay are required.");
    return null;
  }

  if (!entryData.isAllDay && entryData.endDateTime && entryData.startDateTime >= entryData.endDateTime) {
    console.error("createEntryAction Error: endDateTime must be after startDateTime for non-all-day entries.");
    return null;
  }

  try {
    const { databases, account } = await createSessionClient();
    const user = await account.get();
    const userId = user.$id;

    const dataToCreate = {
      ...entryData,
      userId: userId
    };

    const document = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      ID.unique(),
      dataToCreate
    );

    console.log(`Entry created successfully: ${document.$id}`);
    return document;
  } catch (error: unknown) {
    console.error("createEntryAction Error:", error);
    if (error instanceof AppwriteException) {
      console.error(`Appwrite Exception during create: ${error.message} (Code: ${error.code}, Type: ${error.type})`);
    }
    return null;
  }
};

export const getEntryAction = async (entryId: string): Promise<Models.Document | null> => {
  if (!entryId) {
    console.error("getEntryAction Error: entryId is required.");
    return null;
  }

  try {
    const { databases } = await createSessionClient();
    const document = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      entryId
    );
    return document;
  } catch (error: unknown) {
    if (error instanceof AppwriteException && (error.code === 404 || error.code === 403)) {
      console.warn(`getEntryAction: Document ${entryId} not found or access denied.`);
    } else {
      console.error(`getEntryAction Error fetching ${entryId}:`, error);
    }
    return null;
  }
};

export const listEntriesAction = async (): Promise<Models.Document[]> => {
  try {
    const { databases, account } = await createSessionClient();
    const user = await account.get();
    const userId = user.$id;

    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      [
        Query.equal('userId', userId),
        Query.orderDesc('startDateTime')
      ]
    );

    return response.documents;
  } catch (error: unknown) {
    console.error("listEntriesAction Error:", error);
    if (error instanceof AppwriteException) {
       console.error(`Appwrite Exception during list: ${error.message} (Code: ${error.code}, Type: ${error.type})`);
    }
    return [];
  }
};

export const updateEntryAction = async (
  entryId: string,
  entryData: UpdateEntryData
): Promise<Models.Document | null> => {
  if (!entryId || !entryData || Object.keys(entryData).length === 0) {
     console.error("updateEntryAction Error: entryId and non-empty entryData are required.");
     return null;
  }

  if (entryData.startDateTime && entryData.endDateTime && entryData.startDateTime >= entryData.endDateTime && !entryData.isAllDay) {
    console.error("updateEntryAction Error: endDateTime must be after startDateTime for non-all-day entries.");
    return null;
  }

  try {
    const { databases } = await createSessionClient();
    const document = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      entryId,
      entryData
    );
    console.log(`Entry updated successfully: ${document.$id}`);
    return document;
  } catch (error: unknown) {
    if (error instanceof AppwriteException && (error.code === 404 || error.code === 403)) {
       console.warn(`updateEntryAction: Document ${entryId} not found for update or access denied.`);
    } else {
       console.error(`updateEntryAction Error updating ${entryId}:`, error);
    }
    return null;
  }
};

export const deleteEntryAction = async (entryId: string): Promise<boolean> => {
  if (!entryId) {
     console.error("deleteEntryAction Error: entryId is required.");
     return false;
  }

  try {
    const { databases } = await createSessionClient();
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.entriesCollectionId,
      entryId
    );
    console.log(`Entry deleted successfully: ${entryId}`);
    return true;
  } catch (error: unknown) {
    if (error instanceof AppwriteException && (error.code === 404 || error.code === 403)) {
      console.warn(`deleteEntryAction: Document ${entryId} not found for deletion or access denied.`);
    } else {
      console.error(`deleteEntryAction Error deleting ${entryId}:`, error);
    }
    return false;
  }
};

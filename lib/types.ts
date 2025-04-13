import { Models } from "node-appwrite";

export type User = {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    accountId: string; 
    fullName: string;
    email: string;
    entries?: string; 

  } | null; 

  export interface Entry {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    userId: string; 
    title: string;
    content: string;
    startDateTime: string; 
    endDateTime?: string;   
    isAllDay: boolean;     
    status?: 'planned' | 'ongoing' | 'completed' | 'instantaneous';
  }
  export type UserProfileDocument = User & Models.Document;
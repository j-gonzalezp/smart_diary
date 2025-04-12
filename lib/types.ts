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
    entries: string; 

  } | null; 

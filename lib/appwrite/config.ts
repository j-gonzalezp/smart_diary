export const appwriteConfig = {
    endpointUrl: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT!,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
    pendingTasksCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PENDINGTASKS!,
    activityLogCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ACTIVITYLOG!,
    usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
    secretKey: process.env.NEXT_APPWRITE_KEY!
}
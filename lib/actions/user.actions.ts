"use server"

import { createAdminClient, createSessionClient } from "../appwrite"
import { appwriteConfig } from "@/lib/appwrite/config"
import { AppwriteException, Query, ID, Models } from "node-appwrite"
import { parseStringify } from "@/lib/utils"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { User } from "../types"

const getUserByEmail = async (email: string): Promise<(User & Models.Document) | null> => {
  if (!email) return null
  try {
    const { databases } = await createAdminClient()
    const result = await databases.listDocuments<User & Models.Document>(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("email", email)]
    )
    return result.total > 0 ? result.documents[0] : null
  } catch (error: unknown) {
    console.error(`getUserByEmail Error fetching user with email ${email}:`, error)
    if (error instanceof AppwriteException) {
      console.error(`Appwrite Exception: ${error.message} (Code: ${error.code}, Type: ${error.type})`)
    }
    return null
  }
}

const handleError = (error: unknown, context: string): { error: string } => {
  console.error(`Error in ${context}:`, error)
  let errorMessage = `An unexpected error occurred during ${context}.`
  if (error instanceof AppwriteException) {
    errorMessage = `Appwrite error during ${context}: ${error.message} (Code: ${error.code}, Type: ${error.type})`
    console.error(`Appwrite Details: ${errorMessage}`)
  } else if (error instanceof Error) {
    errorMessage = error.message
  }
  return { error: errorMessage }
}

export const sendEmailOTP = async ({ email }: { email: string }): Promise<{ userId: string | null; error?: string }> => {
  try {
    const { account } = await createAdminClient()
    const token = await account.createEmailToken(ID.unique(), email)
    console.log(`OTP sent to ${email}, UserID associated: ${token.userId}`)
    return { userId: token.userId }
  } catch (error: unknown) {
    return { userId: null, ...handleError(error, `sending OTP to ${email}`) }
  }
}

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string
  email: string
}): Promise<{ accountId: string | null; error?: string }> => {
  try {
    const existingUserDoc = await getUserByEmail(email)
    if (existingUserDoc && existingUserDoc.accountId) {
      console.warn(`User document for ${email} already exists. Attempting to resend OTP for account ${existingUserDoc.accountId}.`)
      const otpResult = await sendEmailOTP({ email })
      if (otpResult.error || !otpResult.userId) {
        throw new Error(otpResult.error || "Failed to resend OTP to existing user.")
      }
      return parseStringify({ accountId: otpResult.userId })
    }

    console.log(`No existing document found for ${email}. Sending initial OTP...`)
    const otpResult = await sendEmailOTP({ email })
    if (otpResult.error || !otpResult.userId) {
      throw new Error(otpResult.error || "Failed to send initial OTP.")
    }
    const accountId = otpResult.userId

    const { databases } = await createAdminClient()
    const newUserDocumentData = {
      fullName,
      email,
      accountId,
    }
    const newUserDoc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      newUserDocumentData
    )
    console.log(`User document created: ${newUserDoc.$id} for account ${accountId}`)

    return parseStringify({ accountId })
  } catch (error: unknown) {
    const errorResult = handleError(error, `creating account for ${email}`)
    return parseStringify({ accountId: null, ...errorResult })
  }
}

export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string
  password: string
}): Promise<{ sessionId: string | null; userId: string | null; error?: string }> => {
  try {
    const { account } = await createAdminClient()
    const session = await account.createSession(accountId, password)

    const cookieStore = await cookies()
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    })
    console.log(`Session created and cookie set for userId: ${session.userId}`)

    return parseStringify({ sessionId: session.$id, userId: session.userId })
  } catch (error: unknown) {
    const errorResult = handleError(error, `verifying secret for account ${accountId}`)
    if (error instanceof AppwriteException && (error.code === 401 || error.type === 'user_invalid_credentials' || error.type === 'user_secret_invalid')) {
      return parseStringify({ sessionId: null, userId: null, error: "Invalid OTP or expired request." })
    }
    return parseStringify({ sessionId: null, userId: null, ...errorResult })
  }
}

export const getCurrentUser = async (): Promise<(User & Models.Document) | null> => {
  console.log("getCurrentUser: Attempting...")
  try {
    const { account, databases } = await createSessionClient()
    console.log("getCurrentUser: Session client created. Getting account...")
    const currentAccount = await account.get()
    console.log("getCurrentUser: Account fetched:", currentAccount.$id)

    console.log(`getCurrentUser: Querying user document with accountId: ${currentAccount.$id}`)
    const userDocuments = await databases.listDocuments<User & Models.Document>(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    )
    console.log(`getCurrentUser: Found ${userDocuments.total} documents.`)

    if (userDocuments.total === 0) {
      console.warn(`getCurrentUser: No user document found for accountId: ${currentAccount.$id}. Auth OK, profile missing.`)
      return null
    }
    console.log("getCurrentUser: User document found:", userDocuments.documents[0].$id)
    return userDocuments.documents[0]
  } catch (error: unknown) {
    if (error instanceof AppwriteException) {
      if (error.code === 401 || error.type === 'user_jwt_invalid' || error.type === 'user_session_not_found') {
        console.log("getCurrentUser: No active session or session invalid.")
      } else {
        console.error(`getCurrentUser Appwrite Error: ${error.message} (Code: ${error.code}, Type: ${error.type})`)
      }
    } else {
      console.error("getCurrentUser: An unexpected error occurred:", error)
    }
    return null
  }
}

export const signOutUser = async () => {
  console.log("Signing out user...")
  try {
    const { account } = await createSessionClient()
    await account.deleteSession("current")
    const cookieStore = await cookies()
    cookieStore.delete("appwrite-session")
    console.log("User signed out successfully.")
  } catch (error: unknown) {
    console.error("Error during sign out:", error)
    if (error instanceof AppwriteException) {
      console.error(`Appwrite sign out error: ${error.message}`)
    }
  } finally {
    redirect("/sign-in")
  }
}

export const signInUser = async ({ email }: { email: string }): Promise<{ accountId: string | null; error?: string }> => {
  console.log(`Attempting sign in for ${email}`)
  try {
    const existingUserDoc = await getUserByEmail(email)

    if (existingUserDoc && existingUserDoc.accountId) {
      console.log(`User ${email} found. Sending OTP...`)
      const otpResult = await sendEmailOTP({ email })
      if (otpResult.error || !otpResult.userId) {
        throw new Error(otpResult.error || "Failed to send OTP during sign in.")
      }
      return parseStringify({ accountId: otpResult.userId })
    } else {
      console.log(`User with email ${email} not found.`)
      return parseStringify({ accountId: null, error: "User not found." })
    }
  } catch (error: unknown) {
    const errorResult = handleError(error, `sign in process for ${email}`)
    return parseStringify({ accountId: null, ...errorResult })
  }
}

"use server";

import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID, Models } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User } from "../types";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);

    return session.userId;
  } catch (error) {
    handleError(error, "Failed to send email OTP");
  }
};

export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Failed to send an OTP");

  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        accountId,
      },
    );
  }

  return parseStringify({ accountId });
};

export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession(accountId, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
};

// lib/actions/user.actions.ts
export const getCurrentUser = async (): Promise<(User & Models.Document) | null> => {
  console.log("getCurrentUser: Attempting to get session client...");
  try {
    const { account, databases } = await createSessionClient();
    console.log("getCurrentUser: Session client created. Getting account...");
    const currentAccount = await account.get();
    console.log("getCurrentUser: Account fetched:", currentAccount.$id); // Log account ID

    console.log(`getCurrentUser: Querying database for user with accountId: ${currentAccount.$id}`);
    const userDocuments = await databases.listDocuments<User & Models.Document>(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );
    console.log(`getCurrentUser: Database query result: ${userDocuments.total} documents found.`);

    if (userDocuments.total === 0 || userDocuments.documents.length === 0) {
      console.warn( // Keep this warning
        `getCurrentUser: No user document found in collection ${appwriteConfig.usersCollectionId} for accountId: ${currentAccount.$id}. User might be authenticated but lacks a profile document.`
      );
      return null; // Explicitly return null if document not found
    }
    console.log("getCurrentUser: User document found:", userDocuments.documents[0].$id);
    return userDocuments.documents[0]; // Return the found document

  } catch (error: any) { // Catch specific error types if possible
    console.error("getCurrentUser: Error occurred:", error); // Log the full error
    if (error.code === 401 || error.message?.includes('Session not found') || error.message?.includes('Unauthorized')) {
      console.log("getCurrentUser: No active session or unauthorized.");
    } else {
      console.error("getCurrentUser: An unexpected error occurred during user fetching:", error);
    }
    return null; // Return null on any error
  }
};

export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);


    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    handleError(error, "Failed to sign in user");
  }
};

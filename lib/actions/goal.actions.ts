"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { revalidatePath } from "next/cache";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_GOAL_COLLECTION_ID: GOAL_COLLECTION_ID,
  APPWRITE_GOAL_TRANSACTION_COLLECTION_ID: GOAL_TRANSACTION_COLLECTION_ID,
} = process.env;

export const createGoal = async (goal: CreateGoalParams) => {
  try {
    const { database } = await createAdminClient();

    const newGoal = await database.createDocument(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      ID.unique(),
      {
        ...goal,
        currentAmount: goal.currentAmount || 0,
        status: goal.status || "active",
      }
    );

    revalidatePath("/savings");
    return parseStringify(newGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error; // Re-throw to handle in UI
  }
};

export const getGoals = async ({ userId }: { userId: string }) => {
  try {
    const { database } = await createAdminClient();

    const goals = await database.listDocuments(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    );

    return parseStringify(goals.documents);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [];
  }
};

export const getGoal = async ({ goalId }: { goalId: string }) => {
  try {
    const { database } = await createAdminClient();

    const goal = await database.getDocument(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      goalId
    );

    return parseStringify(goal);
  } catch (error) {
    console.error("Error fetching goal:", error);
    return null;
  }
};

export const updateGoal = async (params: UpdateGoalParams) => {
  try {
    const { database } = await createAdminClient();
    const { goalId, ...data } = params;

    const updatedGoal = await database.updateDocument(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      goalId,
      data
    );

    revalidatePath("/savings");
    return parseStringify(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
};

export const createGoalTransaction = async (transaction: CreateGoalTransactionParams) => {
  try {
    const { database } = await createAdminClient();

    // Destructure to remove 'notes' if it exists, as it's no longer in the schema
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { notes, ...transactionData } = transaction;

    // 1. Create the transaction record
    const newTransaction = await database.createDocument(
      DATABASE_ID!,
      GOAL_TRANSACTION_COLLECTION_ID!,
      ID.unique(),
      transactionData
    );

    // 2. Update the goal's currentAmount
    // We need to fetch the goal first to get the current amount, or we can just increment it if we trust the client?
    // Better to fetch or use atomic updates if Appwrite supported them easily for this.
    // For now, we'll fetch the goal, calculate new amount, and update.
    
    const goal = await database.getDocument(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      transaction.goalId
    );

    const currentAmount = goal.currentAmount || 0;
    const newAmount = currentAmount + transaction.amount;

    await database.updateDocument(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      transaction.goalId,
      {
        currentAmount: newAmount
      }
    );

    revalidatePath("/savings");
    return parseStringify(newTransaction);
  } catch (error) {
    console.error("Error creating goal transaction:", error);
    throw error;
  }
};

export const getGoalTransactions = async ({ goalId }: { goalId: string }) => {
  try {
    const { database } = await createAdminClient();

    const transactions = await database.listDocuments(
      DATABASE_ID!,
      GOAL_TRANSACTION_COLLECTION_ID!,
      [Query.equal("goalId", goalId), Query.orderDesc("date")]
    );

    return parseStringify(transactions.documents);
  } catch (error) {
    console.error("Error fetching goal transactions:", error);
    return [];
  }
};

export const deleteGoal = async ({ goalId }: { goalId: string }) => {
  try {
    const { database } = await createAdminClient();

    await database.deleteDocument(
      DATABASE_ID!,
      GOAL_COLLECTION_ID!,
      goalId
    );

    revalidatePath("/savings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
};

"use server";

import { createAdminClient } from "../appwrite";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getAccounts } from "./bank.actions";
import { plaidClient } from "../plaid";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const BILLS_COLLECTION_ID = process.env.APPWRITE_BILLS_COLLECTION_ID!;
const DEBTS_COLLECTION_ID = process.env.APPWRITE_DEBTS_COLLECTION_ID!;
const BANKS_COLLECTION_ID = process.env.APPWRITE_BANK_COLLECTION_ID!;

export const getBills = async ({ userId }: { userId: string }) => {
  try {
    const { database } = await createAdminClient();
    const bills = await database.listDocuments(
      DATABASE_ID,
      BILLS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    return parseStringify(bills.documents);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return [];
  }
};

export const getDebts = async ({ userId }: { userId: string }) => {
  try {
    const { database } = await createAdminClient();
    const debts = await database.listDocuments(
      DATABASE_ID,
      DEBTS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    return parseStringify(debts.documents);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return [];
  }
};

export const getBill = async ({ id }: { id: string }) => {
  try {
    const { database } = await createAdminClient();
    const bill = await database.getDocument(
      DATABASE_ID,
      BILLS_COLLECTION_ID,
      id
    );
    return parseStringify(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    return null;
  }
}

export const getDebt = async ({ id }: { id: string }) => {
  try {
    const { database } = await createAdminClient();
    const debt = await database.getDocument(
      DATABASE_ID,
      DEBTS_COLLECTION_ID,
      id
    );
    return parseStringify(debt);
  } catch (error) {
    console.error("Error fetching debt:", error);
    return null;
  }
}

const mapPlaidFrequency = (frequency: string): string => {
  const map: Record<string, string> = {
    'WEEKLY': 'weekly',
    'BIWEEKLY': 'bi-weekly',
    'SEMI_MONTHLY': 'bi-weekly',
    'MONTHLY': 'monthly',
    'YEARLY': 'yearly',
    'UNKNOWN': 'monthly'
  };
  return map[frequency] || 'monthly';
};

const calculateNextDate = (lastDate: string, frequency: string): string => {
  const date = new Date(lastDate);
  switch (frequency) {
    case 'WEEKLY': date.setDate(date.getDate() + 7); break;
    case 'BIWEEKLY': date.setDate(date.getDate() + 14); break;
    case 'SEMI_MONTHLY': date.setDate(date.getDate() + 15); break;
    case 'MONTHLY': date.setMonth(date.getMonth() + 1); break;
    case 'YEARLY': date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
};

export const scanRecurringBills = async ({ userId }: { userId: string }) => {
  try {
    const { database } = await createAdminClient();

    // 1. Get all connected banks for the user to access tokens
    const banks = await database.listDocuments(
      DATABASE_ID,
      BANKS_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    if (!banks.documents.length) {
      console.log("No banks found for user");
      return { newBills: 0, updatedBills: 0 };
    }

    let newBillsCount = 0;
    let updatedBillsCount = 0;

    // 2. Iterate through each bank and fetch recurring transactions
    for (const bank of banks.documents) {
      try {
        const response = await plaidClient.transactionsRecurringGet({
          access_token: bank.accessToken
        });

        const { outflow_streams } = response.data;

        // 3. Process each stream
        for (const stream of outflow_streams) {
          // Skip if it's not active or doesn't look like a bill
          if (stream.status !== 'MATURE' && stream.status !== 'EARLY_DETECTION') continue;

          // Check if we already have this bill
          const existingBills = await database.listDocuments(
            DATABASE_ID,
            BILLS_COLLECTION_ID,
            [Query.equal('plaidStreamId', stream.stream_id)]
          );

          const frequency = mapPlaidFrequency(stream.frequency);
          const nextPaymentDate = calculateNextDate(stream.last_date, stream.frequency);

          const billData = {
            userId,
            name: stream.description,
            amount: Math.abs(stream.last_amount.amount || 0), // Ensure positive amount
            dueDate: stream.last_date, // Keep track of the last known date
            frequency: frequency,
            category: (stream.category && stream.category[0]) || 'subscription',
            isAutoDetected: true,
            plaidStreamId: stream.stream_id,
            linkedAccountId: stream.account_id, // Auto-link the account
            status: 'active',
            nextPaymentDate: nextPaymentDate,
          };

          if (existingBills.documents.length > 0) {
            // Update existing bill with latest amount/date
            await database.updateDocument(
              DATABASE_ID,
              BILLS_COLLECTION_ID,
              existingBills.documents[0].$id,
              billData
            );
            updatedBillsCount++;
          } else {
            // Create new bill
            await database.createDocument(
              DATABASE_ID,
              BILLS_COLLECTION_ID,
              ID.unique(),
              billData
            );
            newBillsCount++;
          }
        }
      } catch (plaidError) {
        console.error(`Failed to sync bank ${bank.$id}:`, plaidError);
      }
    }

    revalidatePath('/bills-and-debts');
    return { newBills: newBillsCount, updatedBills: updatedBillsCount };

  } catch (error) {
    console.error("Error scanning recurring bills:", error);
    throw error;
  }
}

export const createBill = async (bill: CreateBillParams) => {
  try {
    const { database } = await createAdminClient();

    const newBill = await database.createDocument(
      DATABASE_ID,
      BILLS_COLLECTION_ID,
      ID.unique(),
      {
        userId: bill.userId,
        name: bill.name,
        amount: bill.amount,
        dueDate: bill.dueDate,
        frequency: bill.frequency,
        category: bill.category,
        isAutoDetected: bill.isAutoDetected || false,
        linkedAccountId: bill.linkedAccountId || null,
        status: bill.status || 'active',
        isPaid: false,
        nextPaymentDate: bill.nextPaymentDate,
      }
    );
    
    revalidatePath('/bills-and-debts');
    return parseStringify(newBill);
  } catch (error) {
    console.error("Error creating bill:", error);
  }
}

export const createDebt = async (debt: CreateDebtParams) => {
  try {
    const { database } = await createAdminClient();

    const newDebt = await database.createDocument(
      DATABASE_ID,
      DEBTS_COLLECTION_ID,
      ID.unique(),
      {
        userId: debt.userId,
        name: debt.name,
        totalAmountPaid: debt.totalAmountPaid,
        initialAmount: debt.initialAmount || debt.totalAmountPaid,
        interestRate: debt.interestRate || null,
        minimumPayment: debt.minimumPayment || null,
        dueDate: debt.dueDate || null,
        type: debt.type,
        linkedAccountId: debt.linkedAccountId || null,
        payoffTargetDate: debt.payoffTargetDate || null,
      }
    );

    revalidatePath('/bills-and-debts');
    return parseStringify(newDebt);
  } catch (error) {
    console.error("Error creating debt:", error);
  }
}

export const updateBill = async (billId: string, data: Partial<CreateBillParams>) => {
  try {
    const { database } = await createAdminClient();
    const updatedBill = await database.updateDocument(
      DATABASE_ID,
      BILLS_COLLECTION_ID,
      billId,
      data
    );
    revalidatePath('/bills-and-debts');
    revalidatePath(`/bills-and-debts/${billId}`);
    return parseStringify(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
  }
}

export const updateDebt = async (debtId: string, data: Partial<CreateDebtParams>) => {
  try {
    const { database } = await createAdminClient();
    const updatedDebt = await database.updateDocument(
      DATABASE_ID,
      DEBTS_COLLECTION_ID,
      debtId,
      data
    );
    revalidatePath('/bills-and-debts');
    revalidatePath(`/bills-and-debts/${debtId}`);
    return parseStringify(updatedDebt);
  } catch (error) {
    console.error("Error updating debt:", error);
  }
}

export const deleteBill = async (billId: string) => {
    try {
        const { database } = await createAdminClient();
        await database.deleteDocument(DATABASE_ID, BILLS_COLLECTION_ID, billId);
        revalidatePath('/bills-and-debts');
    } catch (error) {
        console.error("Error deleting bill:", error);
    }
}

export const deleteDebt = async (debtId: string) => {
    try {
        const { database } = await createAdminClient();
        await database.deleteDocument(DATABASE_ID, DEBTS_COLLECTION_ID, debtId);
        revalidatePath('/bills-and-debts');
    } catch (error) {
        console.error("Error deleting debt:", error);
    }
}

export const makeDebtPayment = async (debtId: string, amount: number, paymentDate?: string) => {
  try {
    const { database } = await createAdminClient();
    
    const debt = await database.getDocument(DATABASE_ID, DEBTS_COLLECTION_ID, debtId);
    const currentPaid = debt.totalAmountPaid || 0;
    const newPaid = currentPaid + amount;

    const updatedDebt = await database.updateDocument(
      DATABASE_ID,
      DEBTS_COLLECTION_ID,
      debtId,
      { totalAmountPaid: newPaid }
    );

    revalidatePath('/bills-and-debts');
    revalidatePath(`/bills-and-debts/${debtId}`);
    return parseStringify(updatedDebt);
  } catch (error) {
    console.error("Error making debt payment:", error);
  }
}

export const markBillAsPaid = async (billId: string, currentNextPaymentDate: string, frequency: string) => {
  try {
    const { database } = await createAdminClient();
    
    let nextDate = new Date(currentNextPaymentDate);
    
    // Calculate next date based on frequency
    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      // Default to monthly if unknown or one-time
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const updatedBill = await database.updateDocument(
      DATABASE_ID,
      BILLS_COLLECTION_ID,
      billId,
      {
        nextPaymentDate: nextDate.toISOString(),
        isPaid: false,
      }
    );

    revalidatePath('/bills-and-debts');
    revalidatePath(`/bills-and-debts/${billId}`);
    return parseStringify(updatedBill);
  } catch (error) {
    console.error("Error marking bill as paid:", error);
  }
}

export const getUserAccounts = async ({ userId }: { userId: string }) => {
  try {
    const result = await getAccounts({ userId });
    return parseStringify(result.data || []);
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    return [];
  }
}

export const syncDebtWithPlaid = async (debtId: string, linkedAccountId: string) => {
    try {
        const { database } = await createAdminClient();
        
        const debt = await database.getDocument(DATABASE_ID, DEBTS_COLLECTION_ID, debtId);
        const result = await getAccounts({ userId: debt.userId });
        
        if (!result || !result.data) return;

        const linkedAccount = result.data.find((acc: any) => acc.appwriteItemId === linkedAccountId || acc.id === linkedAccountId);

        if (linkedAccount) {
            // Calculate paid amount based on initial amount and current balance
            // If current balance > initial amount (e.g. interest), paid is 0
            const newPaid = Math.max(0, debt.initialAmount - linkedAccount.currentBalance);
            
            const updatedDebt = await database.updateDocument(
                DATABASE_ID,
                DEBTS_COLLECTION_ID,
                debtId,
                {
                    totalAmountPaid: newPaid
                }
            );
            revalidatePath('/bills-and-debts');
            return parseStringify(updatedDebt);
        }
    } catch (error) {
        console.error("Error syncing debt with Plaid:", error);
    }
}

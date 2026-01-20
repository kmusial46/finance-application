"use server";

import { CountryCode } from "plaid";
import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";
import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

const formatTransactionCategory = (rawCategory?: string | null) => {
  if (!rawCategory) return "General";

  return rawCategory
    .toString()
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });

    // Process accounts individually and handle errors gracefully
    const accountResults = await Promise.allSettled(
      banks?.map(async (bank: Bank) => {
        try {
          // get each account info from plaid
          const accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });
          const accountData = accountsResponse.data.accounts[0];

          // get institution info from plaid (use fallback if getInstitution fails)
          const institution = await getInstitution({
            institutionId: accountsResponse.data.item.institution_id!,
          });

          const account = {
            id: accountData.account_id,
            availableBalance: accountData.balances.available!,
            currentBalance: accountData.balances.current!,
            institutionId: institution?.institution_id ?? accountsResponse.data.item.institution_id ?? '',
            name: accountData.name,
            officialName: accountData.official_name,
            mask: accountData.mask!,
            type: accountData.type as string,
            subtype: accountData.subtype! as string,
            appwriteItemId: bank.$id,
          };

          return account;
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e: any = error;
          const plaidError = e?.response?.data;
          
          // Handle ITEM_LOGIN_REQUIRED and other Plaid errors
          if (plaidError?.error_code === 'ITEM_LOGIN_REQUIRED') {
            console.warn(`Bank account ${bank.$id} requires re-authentication:`, plaidError.error_message);
            
            // Return a placeholder account with error flag
            return {
              id: bank.$id,
              availableBalance: 0,
              currentBalance: 0,
              institutionId: bank.institutionId || '',
              name: 'Re-authentication Required',
              officialName: 'Re-authentication Required',
              mask: '****',
              type: 'debit',
              subtype: 'debit',
              appwriteItemId: bank.$id,
              needsReauth: true,
              error: plaidError,
            };
          }
          
          // For other errors, throw to be caught by outer catch
          throw error;
        }
      })
    );

    // Separate successful accounts from failed ones
    const accounts = [];
    const errors = [];
    
    for (const result of accountResults) {
      if (result.status === 'fulfilled') {
        accounts.push(result.value);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = result.reason;
        const plaidError = e?.response?.data;
        errors.push(plaidError || { error_message: e?.message || 'Unknown error' });
      }
    }

    // If we have some successful accounts, return them with warnings about failed ones
    if (accounts.length > 0) {
      const totalBanks = accounts.filter(acc => !acc.needsReauth).length;
      const totalCurrentBalance = accounts
        .filter(acc => !acc.needsReauth)
        .reduce((total, account) => total + account.currentBalance, 0);

      return parseStringify({ 
        data: accounts, 
        totalBanks, 
        totalCurrentBalance,
        ...(errors.length > 0 && { partialErrors: errors })
      });
    }

    // If all accounts failed, return error
    if (errors.length > 0) {
      return parseStringify({ error: errors[0], allErrors: errors });
    }

    // No banks to process
    return parseStringify({ data: [], totalBanks: 0, totalCurrentBalance: 0 });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = error;
    const errPayload = e?.response?.data ?? (e?.message ? { message: e.message } : e);
    return parseStringify({ error: errPayload });
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    if (!appwriteItemId) {
      console.error('getAccount: appwriteItemId missing');
      return parseStringify({ error: { error_code: 'MISSING_FIELDS', error_message: 'appwriteItemId is required' } });
    }

    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });

    // Basic validation & debug info
    if (!bank) {
      console.error(`getAccount: bank not found for id ${appwriteItemId}`);
      return parseStringify({ error: { error_message: `Bank not found for id ${appwriteItemId}` } });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((bank as any)?.error) {
      return parseStringify({ error: (bank as any).error });
    }

    // Support different field names that might be present in the DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: any = bank;
    const accessToken = b.accessToken ?? b.access_token ?? null;

    // Log non-sensitive debug info
    try {
      console.debug('getAccount - bank id:', b.$id, 'hasAccessToken:', !!accessToken, 'bankKeys:', Object.keys(b));
    } catch (e) {
      console.debug('getAccount - bank debug unavailable');
    }

    if (!accessToken) {
      return parseStringify({ error: { error_code: 'MISSING_FIELDS', error_message: 'access_token missing on bank document', bank_keys: Object.keys(b) } });
    }

    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    const accountData = accountsResponse.data.accounts[0];

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferDocuments = Array.isArray(transferTransactionsData?.documents)
      ? transferTransactionsData.documents
      : [];

    const transferTransactions = transferDocuments.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: formatTransactionCategory(transferData.category),
        type: "debit",
        senderBankId: transferData.senderBankId,
      })
    );

    // get institution info from plaid (use fallback if getInstitution fails)
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const plaidTransactions = await getTransactions({
      accessToken,
    });

    const transactions = Array.isArray(plaidTransactions)
      ? plaidTransactions
      : [];

    if (!Array.isArray(plaidTransactions)) {
      console.warn("getTransactions returned non-array payload", plaidTransactions);
    }

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution?.institution_id ?? accountsResponse.data.item.institution_id ?? '',
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
    };

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    // include Plaid response body when available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = error;
    const errPayload = e?.response?.data ?? (e?.message ? { message: e.message } : e);
    return parseStringify({ error: errPayload });
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["GB"] as CountryCode[],
    });

    const institution = institutionResponse.data.institution;

    return parseStringify(institution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = error;
    const errPayload = e?.response?.data ?? (e?.message ? { message: e.message } : e);
    return parseStringify({ error: errPayload });
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let cursor: string | undefined;
  const transactions: any[] = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      let attempt = 0;
      const maxAttempts = 3;

      while (true) {
        try {
          const response = await plaidClient.transactionsSync({
            access_token: accessToken,
            cursor,
          });

          const data = response.data;

          transactions.push(
            ...data.added.map((transaction) => ({
              id: transaction.transaction_id,
              name: transaction.name,
              paymentChannel: transaction.payment_channel,
              // Plaid's transaction.amount is positive for debits (money out) and
              // negative for credits (money in). Use the sign to normalise type.
              type: typeof transaction.amount === 'number' && transaction.amount > 0 ? 'debit' : 'credit',
              accountId: transaction.account_id,
              amount: transaction.amount,
              pending: transaction.pending,
              category: formatTransactionCategory(
                transaction.personal_finance_category?.primary ??
                  transaction.category?.[0]
              ),
              date: transaction.date,
              image: transaction.logo_url,
            }))
          );

          cursor = data.next_cursor ?? cursor;
          hasMore = data.has_more;
          break;
        } catch (error) {
          attempt += 1;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e: any = error;
          const status = e?.response?.status;

          if (status === 429 && attempt <= maxAttempts) {
            const retryAfterHeader = e?.response?.headers?.["retry-after"];
            const retryAfterSeconds = retryAfterHeader
              ? Number(retryAfterHeader)
              : attempt;
            const retryDelayMs = Number.isFinite(retryAfterSeconds)
              ? retryAfterSeconds * 1000
              : attempt * 1000;

            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            continue;
          }

          console.error(
            "An error occurred while getting the accounts:",
            e?.response?.data ?? e
          );

          return parseStringify([]);
        }
      }
    }
    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: any = error;
    const errPayload = e?.response?.data ?? (e?.message ? { message: e.message } : e);
    return parseStringify({ error: errPayload });
  }
};
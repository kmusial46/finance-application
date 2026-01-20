"use server";

import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import {
  fetchCompanyProfile,
  fetchQuoteForSymbol,
  searchSymbol,
} from "../market-data";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_INVESTMENT_COLLECTION_ID: INVESTMENT_COLLECTION_ID,
} = process.env;

const missingConfigMessage =
  "Appwrite investment collection is not configured. Please set APPWRITE_DATABASE_ID and APPWRITE_INVESTMENT_COLLECTION_ID.";

const normalizeInvestmentDocument = (doc: any) => {
  if (!doc) return null;

  const rawPrice = doc.pricePerShare;
  const rawShares = doc.shareCount;

  const pricePerShare =
    typeof rawPrice === "number" ? rawPrice : Number(rawPrice ?? 0) || 0;
  const shareCount =
    typeof rawShares === "number" ? rawShares : Number(rawShares ?? 0) || 0;

  const userId =
    typeof doc.userId === "string" && doc.userId.trim().length > 0
      ? doc.userId.trim()
      : undefined;

  const purchaseDate = doc.purchaseDate ? doc.purchaseDate : doc.$createdAt;

  return {
    ...doc,
    userId,
    pricePerShare,
    shareCount,
    purchaseDate,
  };
};

type DatabaseClient = Awaited<ReturnType<typeof createAdminClient>>["database"];

let userIdAttributeEnsured = false;

const ensureUserIdAttribute = async (database: DatabaseClient) => {
  if (userIdAttributeEnsured) return;

  if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
    return;
  }

  try {
    if (typeof (database as any).getAttribute === "function") {
      await (database as any).getAttribute(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        "userId"
      );
    } else {
      const attributes = await (database as any).listAttributes(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID
      );

      const exists = Array.isArray(attributes?.attributes)
        ? attributes.attributes.some((attr: any) => attr?.key === "userId")
        : false;

      if (!exists) {
        throw Object.assign(new Error("missing attribute"), { code: 404 });
      }
    }
    userIdAttributeEnsured = true;
  } catch (attributeError: any) {
    const errorMessage =
      (attributeError && typeof attributeError === "object" && "message" in attributeError)
        ? String(attributeError.message)
        : String(attributeError ?? "");

    if (attributeError?.code && attributeError.code !== 404) {
      console.warn("Unable to verify userId attribute:", errorMessage);
      return;
    }

    try {
      await database.createStringAttribute(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        "userId",
        64,
        false
      );
      userIdAttributeEnsured = true;
      console.log("Created userId attribute on investments collection.");
    } catch (createError) {
      console.error("Failed to create userId attribute:", createError);
    }
  }
};

export const getInvestments = async ({ userId }: GetInvestmentsProps) => {
  try {
    if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
      return parseStringify({ data: [], error: missingConfigMessage });
    }

  const { database } = await createAdminClient();
  await ensureUserIdAttribute(database);

    let documents: any[] = [];

    try {
      const byOwner = await database.listDocuments(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        [Query.equal("userId", [userId]), Query.orderDesc("$createdAt")]
      );

      documents = byOwner.documents ?? [];
    } catch (ownerError) {
      console.warn("Unable to query by userId:", ownerError);
    }

    if (!documents.length) {
      return parseStringify({ data: [] });
    }

    const normalized = await Promise.all(
      documents.map(async (doc: any) => {

        const normalizedDoc = normalizeInvestmentDocument(doc);
        return normalizedDoc;
      })
    );

    const filteredNormalized = normalized
      .filter(Boolean)
      .filter((doc: any) => {
        if (!doc) return false;
        return doc.userId === userId;
      });

    return parseStringify({ data: filteredNormalized });
  } catch (error) {
    console.error("Error fetching investments:", error);
    return parseStringify({
      data: [],
      error: "Unable to load investments. Please try again.",
    });
  }
};

export const createInvestment = async ({
  userId,
  symbol,
  shareCount,
  pricePerShare,
  purchaseDate,
  notes,
}: CreateInvestmentProps) => {
  try {
    if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
      return parseStringify({ error: missingConfigMessage });
    }

    const { database } = await createAdminClient();
    await ensureUserIdAttribute(database);

    const shares = Number(shareCount);
    const cost = Number(pricePerShare);

    if (!Number.isFinite(shares) || shares <= 0) {
      return parseStringify({ error: "Invalid share count provided." });
    }

    if (!Number.isFinite(cost) || cost < 0) {
      return parseStringify({ error: "Invalid cost basis provided." });
    }

    const cleanedSymbol = symbol?.trim().toUpperCase();

    if (!cleanedSymbol) {
      return parseStringify({
        error: "Enter a ticker symbol to continue.",
      });
    }

    // Verify symbol exists
    const quote = await fetchQuoteForSymbol(cleanedSymbol).catch((error) => {
      console.error("Quote lookup error:", error);
      return null;
    });

    if (!quote) {
      return parseStringify({
        error: `Unable to verify symbol "${cleanedSymbol}".`,
      });
    }

    // Get name
    let resolvedName = cleanedSymbol;
    const profile = await fetchCompanyProfile(cleanedSymbol).catch(() => null);
    if (profile?.name) {
      resolvedName = profile.name;
    }

    const sanitizedNotes = typeof notes === "string" ? notes.trim() : undefined;

    const payload = {
      userId: userId,
      symbol: cleanedSymbol,
      name: resolvedName,
      pricePerShare: cost,
      shareCount: shares,
      purchaseDate: purchaseDate,
      notes: sanitizedNotes && sanitizedNotes.length ? sanitizedNotes : undefined,
    };

    const investment = await database.createDocument(
      DATABASE_ID,
      INVESTMENT_COLLECTION_ID,
      ID.unique(),
      payload
    );

    revalidatePath("/investments");

    let normalizedInvestment = normalizeInvestmentDocument(investment);

    return parseStringify(normalizedInvestment ?? investment);
  } catch (error) {
    console.error("Error creating investment:", error);
    const errorMessage =
      (typeof error === "object" && error && "message" in error)
        ? String((error as { message?: unknown }).message)
        : undefined;

    return parseStringify({
      error: errorMessage ?? "Unable to save investment. Please try again.",
    });
  }
};

export const deleteInvestment = async ({
  investmentId,
  userId,
}: DeleteInvestmentProps) => {
  try {
    if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
      return parseStringify({ error: missingConfigMessage });
    }

  const { database } = await createAdminClient();
  await ensureUserIdAttribute(database);

    const existing = await database.getDocument(
      DATABASE_ID,
      INVESTMENT_COLLECTION_ID,
      investmentId
    );

    const normalizedExisting = normalizeInvestmentDocument(existing);
    const ownerId = normalizedExisting?.userId;

    // Only allow delete when the requesting account matches the stored
    // userId.
    if (!normalizedExisting || ownerId !== userId) {
      return parseStringify({ error: "Investment not found." });
    }

    await database.deleteDocument(
      DATABASE_ID,
      INVESTMENT_COLLECTION_ID,
      investmentId
    );

    revalidatePath("/investments");

    return parseStringify({ success: true });
  } catch (error) {
    console.error("Error deleting investment:", error);
    return parseStringify({
      error: "Unable to delete investment. Please try again.",
    });
  }
};

export const updateInvestment = async ({
  investmentId,
  userId,
  data,
}: UpdateInvestmentProps) => {
  try {
    if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
      return parseStringify({ error: missingConfigMessage });
    }

    const { database } = await createAdminClient();
    await ensureUserIdAttribute(database);

    const existing = await database.getDocument(
      DATABASE_ID,
      INVESTMENT_COLLECTION_ID,
      investmentId
    );

    const normalizedExisting = normalizeInvestmentDocument(existing);
    const ownerId = normalizedExisting?.userId;

    // Only allow update when the requesting account matches the stored userId
    if (!normalizedExisting || ownerId !== userId) {
      return parseStringify({ error: "Investment not found." });
    }

    // Validate shareCount if provided
    if (data.shareCount !== undefined) {
      const shares = Number(data.shareCount);
      if (!Number.isFinite(shares) || shares <= 0) {
        return parseStringify({ error: "Invalid share count provided." });
      }
      data.shareCount = shares;
    }

    // Validate pricePerShare if provided
    if (data.pricePerShare !== undefined) {
      const price = Number(data.pricePerShare);
      if (!Number.isFinite(price) || price < 0) {
        return parseStringify({ error: "Invalid price provided." });
      }
      data.pricePerShare = price;
    }

    const updated = await database.updateDocument(
      DATABASE_ID,
      INVESTMENT_COLLECTION_ID,
      investmentId,
      data
    );

    revalidatePath("/investments");

    const normalizedUpdated = normalizeInvestmentDocument(updated);
    return parseStringify(normalizedUpdated ?? updated);
  } catch (error) {
    console.error("Error updating investment:", error);
    return parseStringify({
      error: "Unable to update investment. Please try again.",
    });
  }
};

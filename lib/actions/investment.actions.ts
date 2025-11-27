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

  const ownerAccountId =
    typeof doc.ownerAccountId === "string" && doc.ownerAccountId.trim().length > 0
      ? doc.ownerAccountId.trim()
      : undefined;

  return {
    ...doc,
    ownerAccountId,
    pricePerShare,
    shareCount,
  };
};

type DatabaseClient = Awaited<ReturnType<typeof createAdminClient>>["database"];

let ownerAccountAttributeEnsured = false;

const ensureOwnerAccountAttribute = async (database: DatabaseClient) => {
  if (ownerAccountAttributeEnsured) return;

  if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
    return;
  }

  try {
    if (typeof (database as any).getAttribute === "function") {
      await (database as any).getAttribute(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        "ownerAccountId"
      );
    } else {
      const attributes = await (database as any).listAttributes(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID
      );

      const exists = Array.isArray(attributes?.attributes)
        ? attributes.attributes.some((attr: any) => attr?.key === "ownerAccountId")
        : false;

      if (!exists) {
        throw Object.assign(new Error("missing attribute"), { code: 404 });
      }
    }
    ownerAccountAttributeEnsured = true;
  } catch (attributeError: any) {
    const errorMessage =
      (attributeError && typeof attributeError === "object" && "message" in attributeError)
        ? String(attributeError.message)
        : String(attributeError ?? "");

    if (attributeError?.code && attributeError.code !== 404) {
      console.warn("Unable to verify ownerAccountId attribute:", errorMessage);
      return;
    }

    try {
      await database.createStringAttribute(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        "ownerAccountId",
        64,
        false
      );
      ownerAccountAttributeEnsured = true;
      console.log("Created ownerAccountId attribute on investments collection.");
    } catch (createError) {
      console.error("Failed to create ownerAccountId attribute:", createError);
    }
  }
};

export const getInvestments = async ({ userId }: GetInvestmentsProps) => {
  try {
    if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
      return parseStringify({ data: [], error: missingConfigMessage });
    }

  const { database } = await createAdminClient();
  await ensureOwnerAccountAttribute(database);

    let documents: any[] = [];

    try {
      const byOwner = await database.listDocuments(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        [Query.equal("ownerAccountId", [userId]), Query.orderDesc("$createdAt")]
      );

      documents = byOwner.documents ?? [];
    } catch (ownerError) {
      console.warn("Unable to query by ownerAccountId:", ownerError);
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
        return doc.ownerAccountId === userId;
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
  input,
  shareCount,
  notes,
}: CreateInvestmentProps) => {
  try {
    if (!DATABASE_ID || !INVESTMENT_COLLECTION_ID) {
      return parseStringify({ error: missingConfigMessage });
    }

    const { database } = await createAdminClient();
    await ensureOwnerAccountAttribute(database);

    const shares = Number(shareCount);

    if (!Number.isFinite(shares) || shares <= 0) {
      return parseStringify({ error: "Invalid share count provided." });
    }

    const cleanedInput = input?.trim();

    if (!cleanedInput) {
      return parseStringify({
        error: "Enter a ticker symbol or company name to continue.",
      });
    }

    const compactInput = cleanedInput.replace(/\s+/g, "");
    const possibleTicker = compactInput.toUpperCase();
    const looksLikeTicker = /^[A-Z0-9.-]{1,12}$/.test(possibleTicker);

    let resolvedSymbol = looksLikeTicker ? possibleTicker : "";
    let resolvedName = "";
    let quote: Awaited<ReturnType<typeof fetchQuoteForSymbol>> | null = null;

    if (resolvedSymbol) {
      quote = await fetchQuoteForSymbol(resolvedSymbol).catch((error) => {
        console.error("Quote lookup error:", error);
        return null;
      });

      if (!quote) {
        resolvedSymbol = "";
      }
    }

    if (!resolvedSymbol) {
      const searchResult = await searchSymbol(cleanedInput).catch((error) => {
        console.error("Symbol search failed:", error);
        return null;
      });

      if (searchResult?.symbol) {
        resolvedSymbol = searchResult.symbol.toUpperCase();
        if (searchResult.name) {
          resolvedName = searchResult.name;
        }

        quote = await fetchQuoteForSymbol(resolvedSymbol).catch((error) => {
          console.error("Quote lookup error:", error);
          return null;
        });
      }
    }

    if (!resolvedSymbol || !quote?.price) {
      return parseStringify({
        error: `Unable to find market data for "${cleanedInput}". Please check the input and try again.`,
      });
    }

    if (!resolvedName) {
      const profile = await fetchCompanyProfile(resolvedSymbol).catch((error) => {
        console.error("Company profile lookup error:", error);
        return null;
      });

      if (profile?.name) {
        resolvedName = profile.name;
      }
    }

    if (!resolvedName) {
      resolvedName = cleanedInput;
    }

    const sanitizedNotes = typeof notes === "string" ? notes.trim() : undefined;

    const payload = {
      ownerAccountId: userId,
      symbol: resolvedSymbol,
      name: resolvedName,
      pricePerShare: quote.price,
      shareCount: shares,
      notes: sanitizedNotes && sanitizedNotes.length ? sanitizedNotes : undefined,
    };

    let existingDocument: any | null = null;

    try {
      const filters = [
        Query.equal("ownerAccountId", [userId]),
        Query.equal("symbol", resolvedSymbol),
        Query.limit(1),
      ];

      const existing = await database.listDocuments(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        filters
      );

      existingDocument = existing.total > 0 ? existing.documents[0] : null;
    } catch (queryError) {
      try {
        const fallbackFilters = [
          Query.equal("symbol", resolvedSymbol),
          Query.orderDesc("$createdAt"),
        ];

        const fallback = await database.listDocuments(
          DATABASE_ID,
          INVESTMENT_COLLECTION_ID,
          fallbackFilters
        );

        existingDocument =
          fallback.documents.find((doc: any) => {
            const normalized = normalizeInvestmentDocument(doc);
            if (!normalized) return false;
            if (normalized.symbol !== resolvedSymbol) return false;
            return normalized.ownerAccountId === userId;
          }) ?? null;
      } catch (fallbackError) {
        throw queryError;
      }
    }

    let investment;

    if (existingDocument) {
      const normalizedExisting = normalizeInvestmentDocument(existingDocument);
      const currentShares = normalizedExisting?.shareCount ?? 0;

      const updatedPayload = {
        ...payload,
        shareCount: currentShares + shares,
        pricePerShare: quote.price,
      };

      investment = await database.updateDocument(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        existingDocument.$id,
        updatedPayload
      );
    } else {
      investment = await database.createDocument(
        DATABASE_ID,
        INVESTMENT_COLLECTION_ID,
        ID.unique(),
        payload
      );
    }

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
  await ensureOwnerAccountAttribute(database);

    const existing = await database.getDocument(
      DATABASE_ID,
      INVESTMENT_COLLECTION_ID,
      investmentId
    );

    const normalizedExisting = normalizeInvestmentDocument(existing);
    const ownerAccountId = normalizedExisting?.ownerAccountId;

    // Only allow delete when the requesting account matches the stored
    // ownerAccountId.
    if (!normalizedExisting || ownerAccountId !== userId) {
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

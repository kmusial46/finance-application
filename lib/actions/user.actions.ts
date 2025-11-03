'use server'

import { ID, Query } from "node-appwrite"
import { createAdminClient, createSessionClient } from "../appwrite"
import { cookies } from "next/headers"
import { parseStringify } from "../utils"
import { CountryCode, Products } from "plaid"
import { plaidClient } from "../plaid"
import { revalidatePath } from "next/cache"

const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID
} = process.env

export const signIn = async ({email, password}: signInProps) => {
    try {
        const { account } = await createAdminClient()

        const response = await account.createEmailPasswordSession({
            email,
            password
        })

        // Persist session secret in a cookie so subsequent requests from the
        // browser include the Appwrite session and the user is considered logged in.
        try {
            const cookieStore = await cookies()
            cookieStore.set("appwrite-session", response.secret, {
                path: "/",
                httpOnly: true,
                sameSite: "strict",
                    secure: process.env.NODE_ENV === 'production',
            })
        } catch (cookieError) {
            // non-fatal: log and continue returning the session response
            console.log('Failed to set session cookie:', cookieError)
        }

        return parseStringify(response)
    } catch (error) {
        console.log('Error:', error)
        return parseStringify({ error: String(error) })
    }
}


export const signUp = async (userData: SignUpParams) => {
    const { email, password, firstName, lastName } = userData

    let newUserAccount

    try {
        const { account, database } = await createAdminClient()

        newUserAccount = await account.create({
            userId: ID.unique(),
            email,
            password,
            name: `${firstName} ${lastName}`,
        })

        if(!newUserAccount) throw new Error('Error creating user')

            // Debug: log presence of Appwrite envs so we can see why creation may be skipped
            console.log('Appwrite env presence:', {
                DATABASE_ID: !!DATABASE_ID,
                USER_COLLECTION_ID: !!USER_COLLECTION_ID,
                BANK_COLLECTION_ID: !!BANK_COLLECTION_ID
            })

            if (!DATABASE_ID || !USER_COLLECTION_ID) {
                console.log('Appwrite database or user collection ID missing; skipping database user document creation')
            } else {
                // Use positional args to match node-appwrite Databases.createDocument signature
                    // whitelist fields to match Appwrite collection schema
                    const userDoc = {
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        address1: userData.address1,
                        city: userData.city,
                        postcode: userData.postcode,
                        dateOfBirth: userData.dateOfBirth,
                        nationalInsuranceNumber: userData.nationalInsuranceNumber,
                        userId: newUserAccount.$id
                    }

                    await database.createDocument(
                        DATABASE_ID!,
                        USER_COLLECTION_ID!,
                        ID.unique(),
                        userDoc
                    )
            }
        
        const session = await account.createEmailPasswordSession({
            email,
            password
        });

        const cookieStore = await cookies()
        cookieStore.set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
                secure: process.env.NODE_ENV === 'production',
        });

        return parseStringify(newUserAccount)
    } catch (error) {
        console.error('Error signing up user:', error)
        return parseStringify({ error: String(error) })
    }
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const user = await account.get();

    return parseStringify(user)
  } catch (error) {
    return null;
  }
}

export const logoutAccount = async () => {
    try {
        const { account } = await createSessionClient()

        await account.deleteSession({sessionId: "current"})

        const cookieStore = await cookies()
        cookieStore.delete("appwrite-session")


    } catch (error) {
        
    }
}

export const createLinkToken = async (user: User) => {
    try {
        const tokenParams = {
            user: { client_user_id: user.$id },
            client_name: `${user.firstName} ${user.lastName}`,
            products: ['auth'] as Products[],
            language: 'en',
            country_codes: ['GB'] as CountryCode[]
        }

        console.log('Plaid createLinkToken - tokenParams:', JSON.stringify(tokenParams))

        const response = await plaidClient.linkTokenCreate(tokenParams)

        console.log('Plaid createLinkToken - response:', response?.data)

        return parseStringify({ linkToken: response.data.link_token })
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = error
        console.error('Error creating link token:', e?.response?.data ?? e)
        return parseStringify({ error: String(e?.response?.data ?? e) })
    }
}

export const createBankAccount = async ({
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
}: createBankAccountProps) => {
    try {
        const { database } = await createAdminClient()

        if (!DATABASE_ID || !BANK_COLLECTION_ID) {
            console.log('Appwrite database or bank collection ID missing; skipping bank document creation')
            return null
        }

        console.log('createBankAccount - using DATABASE_ID:', DATABASE_ID, 'BANK_COLLECTION_ID:', BANK_COLLECTION_ID)

        const payload = {
            userId,
            bankId,
            accountId,
            accessToken,
            fundingSourceUrl,
        }

        console.log('Creating bank document with payload:', payload)

        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            ID.unique(),
            payload
        )

        console.log('Bank document created:', bankAccount)

        return parseStringify(bankAccount)
    } catch (error) {
        console.error('Error creating bank account document:', error)
        return parseStringify({ error: String(error) })
    }
}

export const exchangePublicToken = async ({publicToken, user}: exchangePublicTokenProps) => {
    try {
        console.log('exchangePublicToken called - publicToken length:', publicToken?.length, 'user id:', user?.$id)
        const response = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken
        })

        console.log('itemPublicTokenExchange response:', response?.data)

        const accessToken = response.data.access_token
        const itemId = response.data.item_id

        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken
        })

        console.log('accountsGet response:', accountsResponse?.data)

        const accountData = accountsResponse.data.accounts[0]

        console.log('Using accountData:', accountData)

        const fundingSourceUrl = ""

        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
        })

        revalidatePath('/')

        return parseStringify({publicTokenExchange: 'Complete'})
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = error
        console.error('Error exchanging public token:', e?.response?.data ?? e)
        return parseStringify({ error: String(e?.response?.data ?? e) })
    }
}

export const getBanks = async ({ userId }: getBanksProps) => {
    try {
        const { database } = await createAdminClient()

        if (!DATABASE_ID || !BANK_COLLECTION_ID) {
            console.log('Appwrite database or bank collection ID missing; skipping bank retrieval')
            return null
        }

        const banks = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('userId', userId)]
        )

        return parseStringify(banks.documents)
    } catch (error) {
        console.error('Error getting banks:', error)
        return parseStringify({ error: String(error) })
    }
}

export const getBank = async ({ documentId }: getBankProps) => {
    try {
        const { database } = await createAdminClient()

        if (!DATABASE_ID || !BANK_COLLECTION_ID) {
            console.log('Appwrite database or bank collection ID missing; skipping bank retrieval')
            return null
        }

        const bank = await database.listDocuments(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            [Query.equal('$id', documentId)]
        )

        return parseStringify(bank.documents)
    } catch (error) {
        console.error('Error getting banks:', error)
        return parseStringify({ error: String(error) })
    }
}

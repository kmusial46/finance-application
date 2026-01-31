'use server'

import { ID, Query } from "node-appwrite"
import { createAdminClient, createSessionClient } from "../appwrite"
import { cookies } from "next/headers"
import { parseStringify } from "../utils"
import { CountryCode, Products } from "plaid"
import { plaidClient } from "../plaid"
import { revalidatePath } from "next/cache"
import { encrypt } from "../crypto"

const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_USERS_COLLECTION_ID: USER_COLLECTION_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID
} = process.env

export const signIn = async ({email, password}: signInProps) => {
    try {
        const { account } = await createAdminClient()

        const response = await account.createEmailPasswordSession(
            email,
            password
        )

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
    const { email, password, firstName, lastName, phone } = userData

    let newUserAccount

    try {
        const { account, database, user } = await createAdminClient()

        // Check for duplicate email and phone in database first
        const errors: { field: string; message: string }[] = []
        
        if (DATABASE_ID && USER_COLLECTION_ID) {
            // Check both email and phone in parallel
            const [existingEmailDocs, existingPhoneDocs] = await Promise.all([
                database.listDocuments(
                    DATABASE_ID,
                    USER_COLLECTION_ID,
                    [Query.equal('email', email)]
                ),
                database.listDocuments(
                    DATABASE_ID,
                    USER_COLLECTION_ID,
                    [Query.equal('phone', phone)]
                )
            ])

            if (existingEmailDocs.total > 0) {
                errors.push({ field: 'email', message: 'An account with this email already exists' })
            }

            if (existingPhoneDocs.total > 0) {
                errors.push({ field: 'phone', message: 'An account with this phone number already exists' })
            }

            // If there are validation errors, return them
            if (errors.length > 0) {
                return parseStringify({ errors })
            }
        }

        try {
            newUserAccount = await account.create(
                ID.unique(),
                email,
                password,
                `${firstName} ${lastName}`
            )
        } catch (createError: any) {
            if (createError?.code === 409) {
                return parseStringify({ errors: [{ field: 'email', message: 'An account with this email already exists' }] })
            } else {
                throw createError
            }
        }

        if(!newUserAccount) throw new Error('Error creating or retrieving user')

        // Debug: log presence of Appwrite envs so we can see why creation may be skipped
        console.log('Appwrite env presence:', {
            DATABASE_ID: !!DATABASE_ID,
            USER_COLLECTION_ID: !!USER_COLLECTION_ID,
            BANK_COLLECTION_ID: !!BANK_COLLECTION_ID
        })

        if (!DATABASE_ID || !USER_COLLECTION_ID) {
            console.log('Appwrite database or user collection ID missing; skipping database user document creation')
        } else {
            // Check if user document already exists
            const existingDocs = await database.listDocuments(
                DATABASE_ID,
                USER_COLLECTION_ID,
                [Query.equal('userId', newUserAccount.$id)]
            )

            if (existingDocs.total === 0) {
                // Use positional args to match node-appwrite Databases.createDocument signature
                // whitelist fields to match Appwrite collection schema
                const userDoc = {
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    userId: newUserAccount.$id
                }

                console.log('Attempting to create user document with payload:', userDoc)

                try {
                    await database.createDocument(
                        DATABASE_ID!,
                        USER_COLLECTION_ID!,
                        newUserAccount.$id,
                        userDoc
                    )
                    console.log('User document created successfully')
                } catch (dbError) {
                    console.error('Error creating user document in database:', dbError)
                    throw dbError
                }
            } else {
                console.log('User document already exists, skipping creation')
            }
        }
        
        const session = await account.createEmailPasswordSession(
            email,
            password
        );

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

export const createLinkToken = async (user: User | Partial<User> | null | undefined) => {
    try {
        if (!user) {
            throw new Error('Missing user context while creating Plaid link token')
        }

        const clientUserId = user.$id ?? user.userId

        if (!clientUserId) {
            throw new Error('User record is missing an id for Plaid link token creation')
        }

        const derivedClientName = (() => {
            const nameParts = [user.firstName, user.lastName].filter((part) => typeof part === 'string' && part.trim().length > 0)

            if (nameParts.length > 0) {
                return nameParts.join(' ')
            }

            if (typeof user.name === 'string' && user.name.trim().length > 0) {
                return user.name.trim()
            }

            return 'Aureon User'
        })()

        const tokenParams = {
            user: { client_user_id: clientUserId },
            client_name: derivedClientName,
            products: ['auth'] as Products[],
            language: 'en',
            country_codes: ['GB'] as CountryCode[]
        }

    const response = await plaidClient.linkTokenCreate(tokenParams)

        return parseStringify({ linkToken: response.data.link_token })
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = error
        console.error('Error creating link token:', e?.response?.data ?? e)
        return parseStringify({ error: String(e?.response?.data ?? e) })
    }
}

// Create a link token specifically for re-authenticating an existing bank connection
export const createUpdateLinkToken = async (accessToken: string) => {
    try {
        if (!accessToken) {
            throw new Error('Missing access token for update mode link token creation')
        }

        const response = await plaidClient.linkTokenCreate({
            access_token: accessToken,
            user: { client_user_id: 'update-mode-user' },
            client_name: 'Aureon',
            language: 'en',
            country_codes: ['GB'] as CountryCode[]
        })

        return parseStringify({ linkToken: response.data.link_token })
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e: any = error
        const errorData = e?.response?.data
        console.error('Error creating update link token:', errorData ?? e)
        return parseStringify({ 
            error: {
                message: errorData?.error_message ?? e?.message ?? 'Failed to create update link token',
                code: errorData?.error_code ?? 'UNKNOWN_ERROR',
                details: errorData
            }
        })
    }
}

export const createBankAccount = async ({
    userId,
    bankId,
    accountId,
    accessToken,
}: createBankAccountProps) => {
    try {
        const { database } = await createAdminClient()

        if (!DATABASE_ID || !BANK_COLLECTION_ID) {
            console.log('Appwrite database or bank collection ID missing; skipping bank document creation')
            return null
        }

        console.log('createBankAccount - using DATABASE_ID:', DATABASE_ID, 'BANK_COLLECTION_ID:', BANK_COLLECTION_ID)

        const documentId = (() => {
            if (typeof bankId === 'string' && /^[a-zA-Z0-9._-]{1,36}$/.test(bankId)) {
                return bankId
            }

            if (typeof bankId === 'string' && bankId.length > 0) {
                console.warn('Bank Plaid item id not suitable as Appwrite document id, falling back to unique id')
            }

            return ID.unique()
        })()

        // Encrypt the access token before storing
        const encryptedAccessToken = encrypt(accessToken)

        const payload = {
            userId,
            accountId,
            accessToken: encryptedAccessToken,
            bankId,
        }

        console.log('Creating bank document with payload:', { ...payload, accessToken: '[ENCRYPTED]' })

        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            documentId,
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

        await createBankAccount({
            userId: user.userId || user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
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

        const bank = await database.getDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            documentId
        )

        return parseStringify(bank)
    } catch (error) {
        console.error('Error getting banks:', error)
        return parseStringify({ error: String(error) })
    }
}

export const deleteUserAccount = async ({ userId }: { userId: string }) => {
    try {
        const { database, user } = await createAdminClient()

        const {
            APPWRITE_BILLS_COLLECTION_ID: BILLS_COLLECTION_ID,
            APPWRITE_DEBTS_COLLECTION_ID: DEBTS_COLLECTION_ID,
            APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
            APPWRITE_INVESTMENT_COLLECTION_ID: INVESTMENT_COLLECTION_ID,
            APPWRITE_GOAL_COLLECTION_ID: GOAL_COLLECTION_ID,
            APPWRITE_GOAL_TRANSACTION_COLLECTION_ID: GOAL_TRANSACTION_COLLECTION_ID,
        } = process.env

        // 1) Delete all bank documents and related transactions
        if (DATABASE_ID && BANK_COLLECTION_ID) {
            const banks = await database.listDocuments(
                DATABASE_ID,
                BANK_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )

            for (const bank of banks.documents) {
                // Delete transactions referencing this bank (by senderBankId or accountId)
                if (DATABASE_ID && TRANSACTION_COLLECTION_ID) {
                    const txBySender = await database.listDocuments(
                        DATABASE_ID,
                        TRANSACTION_COLLECTION_ID,
                        [Query.equal('senderBankId', bank.$id)]
                    )
                    for (const tx of txBySender.documents) {
                        await database.deleteDocument(DATABASE_ID, TRANSACTION_COLLECTION_ID, tx.$id)
                    }

                    const txByAccount = await database.listDocuments(
                        DATABASE_ID,
                        TRANSACTION_COLLECTION_ID,
                        [Query.equal('accountId', bank.accountId)]
                    )
                    for (const tx of txByAccount.documents) {
                        await database.deleteDocument(DATABASE_ID, TRANSACTION_COLLECTION_ID, tx.$id)
                    }
                }

                // Delete bank document
                await database.deleteDocument(
                    DATABASE_ID,
                    BANK_COLLECTION_ID,
                    bank.$id
                )
            }
        }

        // 2) Delete bills
        if (DATABASE_ID && BILLS_COLLECTION_ID) {
            const bills = await database.listDocuments(
                DATABASE_ID,
                BILLS_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )
            for (const bill of bills.documents) {
                await database.deleteDocument(DATABASE_ID, BILLS_COLLECTION_ID, bill.$id)
            }
        }

        // 3) Delete debts
        if (DATABASE_ID && DEBTS_COLLECTION_ID) {
            const debts = await database.listDocuments(
                DATABASE_ID,
                DEBTS_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )
            for (const debt of debts.documents) {
                await database.deleteDocument(DATABASE_ID, DEBTS_COLLECTION_ID, debt.$id)
            }
        }

        // 4) Delete investments
        if (DATABASE_ID && INVESTMENT_COLLECTION_ID) {
            const investments = await database.listDocuments(
                DATABASE_ID,
                INVESTMENT_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )
            for (const investment of investments.documents) {
                await database.deleteDocument(DATABASE_ID, INVESTMENT_COLLECTION_ID, investment.$id)
            }
        }

        // 5) Delete goals and their transactions
        if (DATABASE_ID && GOAL_COLLECTION_ID) {
            const goals = await database.listDocuments(
                DATABASE_ID,
                GOAL_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )
            for (const goal of goals.documents) {
                // Delete goal transactions for this goal
                if (DATABASE_ID && GOAL_TRANSACTION_COLLECTION_ID) {
                    const goalTransactions = await database.listDocuments(
                        DATABASE_ID,
                        GOAL_TRANSACTION_COLLECTION_ID,
                        [Query.equal('goalId', goal.$id)]
                    )
                    for (const goalTx of goalTransactions.documents) {
                        await database.deleteDocument(DATABASE_ID, GOAL_TRANSACTION_COLLECTION_ID, goalTx.$id)
                    }
                }
                // Delete goal document
                await database.deleteDocument(DATABASE_ID, GOAL_COLLECTION_ID, goal.$id)
            }
        }

        // 6) Delete user document from database
        if (DATABASE_ID && USER_COLLECTION_ID) {
            const userDocs = await database.listDocuments(
                DATABASE_ID,
                USER_COLLECTION_ID,
                [Query.equal('userId', userId)]
            )

            for (const doc of userDocs.documents) {
                await database.deleteDocument(
                    DATABASE_ID,
                    USER_COLLECTION_ID,
                    doc.$id
                )
            }
        }

        // 7) Delete the Appwrite account
        await user.delete(userId)

        // 8) Delete session cookie
        const cookieStore = await cookies()
        cookieStore.delete("appwrite-session")

        return parseStringify({ success: true })
    } catch (error) {
        console.error('Error deleting user account:', error)
        return parseStringify({ error: String(error) })
    }
}

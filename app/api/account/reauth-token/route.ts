import { NextRequest, NextResponse } from 'next/server'
import { getBank } from '@/lib/actions/user.actions'
import { createUpdateLinkToken } from '@/lib/actions/user.actions'
import { decrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const appwriteItemId = searchParams.get('appwriteItemId')

    if (!appwriteItemId) {
      return NextResponse.json(
        { error: 'Missing appwriteItemId parameter' },
        { status: 400 }
      )
    }

    // Get the bank record to retrieve the access token
    const bank = await getBank({ documentId: appwriteItemId })

    if (!bank || (bank as any)?.error) {
      console.error('Bank not found or error:', (bank as any)?.error)
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      )
    }

    // Log bank keys for debugging (without sensitive data)
    console.log('Bank document keys:', Object.keys(bank))

    // Create an update mode link token using the access token
    const encryptedAccessToken = (bank as any).accessToken ?? (bank as any).access_token

    if (!encryptedAccessToken) {
      console.error('Access token missing. Bank document keys:', Object.keys(bank))
      return NextResponse.json(
        { error: 'Access token not found for this bank account' },
        { status: 400 }
      )
    }

    // Decrypt the access token before using it
    const accessToken = decrypt(encryptedAccessToken)

    const linkTokenResponse = await createUpdateLinkToken(accessToken)

    if ((linkTokenResponse as any)?.error) {
      console.error('createUpdateLinkToken error:', (linkTokenResponse as any).error)
      return NextResponse.json(
        { error: (linkTokenResponse as any).error },
        { status: 500 }
      )
    }

    return NextResponse.json({ linkToken: (linkTokenResponse as any).linkToken })
  } catch (error) {
    console.error('Error in reauth-token API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite'

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID
} = process.env

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const appwriteItemId = searchParams.get('appwriteItemId')

    if (!appwriteItemId) {
      return NextResponse.json(
        { error: 'Missing appwriteItemId parameter' },
        { status: 400 }
      )
    }

    if (!DATABASE_ID || !BANK_COLLECTION_ID) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      )
    }

    const { database } = await createAdminClient()

    // Delete the bank document from Appwrite
    await database.deleteDocument(
      DATABASE_ID,
      BANK_COLLECTION_ID,
      appwriteItemId
    )

    return NextResponse.json({ success: true, message: 'Bank account removed successfully' })
  } catch (error) {
    console.error('Error removing bank account:', error)
    return NextResponse.json(
      { error: 'Failed to remove bank account' },
      { status: 500 }
    )
  }
}

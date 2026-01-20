"use client"

import { formatAmount } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { Button } from './button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'

interface BankCardProps {
  account: Account
  username: string
  showBalance?: boolean
  showRemoveButton?: boolean
}

const BankCard = ({account, username, showBalance=true, showRemoveButton=true}: BankCardProps) => {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const needsReauth = account.needsReauth

  useEffect(() => {
    if (!needsReauth) return

    const getLinkToken = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/account/reauth-token?appwriteItemId=${account.appwriteItemId}`)
        const data = await response.json()

        if (data?.linkToken) {
          setToken(data.linkToken)
        } else {
          console.error('Failed to fetch reauth link token:', JSON.stringify(data.error, null, 2))
        }
      } catch (error) {
        console.error('Error getting reauth link token:', error)
      } finally {
        setLoading(false)
      }
    }

    getLinkToken()
  }, [needsReauth, account.appwriteItemId])

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async () => {
    // Refresh the page to reflect the updated connection
    router.refresh()
  }, [router])

  const config: PlaidLinkOptions = {
    token,
    onSuccess
  }

  const { open, ready } = usePlaidLink(config)

  const handleReauthenticate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (ready) {
      open()
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirmDialog(true)
  }

  const confirmRemove = async () => {
    try {
      setRemoving(true)
      setShowConfirmDialog(false)
      const response = await fetch(`/api/account/remove?appwriteItemId=${account.appwriteItemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Failed to remove account: ${data.error}`)
      }
    } catch (error) {
      console.error('Error removing account:', error)
      alert('Failed to remove account. Please try again.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
    <div className='flex flex-col gap-2'>
        <Link href={needsReauth ? '#' : `/transaction-history/?id=${account.appwriteItemId}`} className={`bank-card ${needsReauth ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <div className='bank-card_content'>
                <div>
                    <h1 className='text-16 font-semibold text-white'>
                        {account.name}
                    </h1>
                    <p className='font-ibm-plex-serif font-black text-white'>
                        {needsReauth ? '$---.--' : formatAmount(account.currentBalance || 0)}
                    </p>
                </div>

                <article className='flex flex-col gap-2'>
                    <div className='flex justify-between'>
                        <h1 className='text-12 font-semibold text-white'>
                            {username}
                        </h1>
                        <h2 className='text-12 font-semibold text-white'>
                            ●● / ●●
                        </h2>
                    </div>
                    <p className='text-14 font-semibold tracking-[1.1px] text-white'>
                        ●●●● ●●●● ●●●● <span className='text-16'>{account?.mask}</span>
                    </p>
                </article>
            </div>
            <div className='bank-card_icon'>
                <Image 
                    src='/icons/Paypass.svg'
                    alt='Pay icon'
                    width={20}
                    height={24}
                />
                <Image 
                    src='/icons/mastercard.svg'
                    alt='Mastercard icon'
                    width={45}
                    height={32}
                    className='ml-5'
                />
            </div>
            <Image 
                src='/icons/lines.png'
                alt='Bank Card Background'
                width={316}
                height={190}
                className='absolute top-0 left-0'
            />
        </Link>

        {needsReauth && (
          <div className='flex gap-2 w-full'>
            <Button
              onClick={handleReauthenticate}
              disabled={!ready || loading}
              className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
              size='sm'
            >
              {loading ? 'Loading...' : ready ? 'Re-authenticate' : 'Preparing...'}
            </Button>
            {showRemoveButton && (
              <Button
                onClick={handleRemove}
                disabled={removing}
                className='bg-red-600 hover:bg-red-700 text-white min-w-[80px]'
                size='sm'
              >
                {removing ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>
        )}

        {!needsReauth && showRemoveButton && (
          <Button
            onClick={handleRemove}
            disabled={removing}
            variant='outline'
            className='w-full border-red-600 text-red-600 hover:bg-red-50'
            size='sm'
          >
            {removing ? 'Removing...' : 'Remove Account'}
          </Button>
        )}
    </div>

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Remove Bank Account?</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <span className='font-semibold'>{account.name}</span> ({account.mask})?
            <br /><br />
            This action cannot be undone. All transaction history associated with this account will be removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex gap-2 sm:gap-2'>
          <Button
            variant='outline'
            onClick={() => setShowConfirmDialog(false)}
            disabled={removing}
          >
            Cancel
          </Button>
          <Button
            className='bg-red-600 hover:bg-red-700 text-white'
            onClick={confirmRemove}
            disabled={removing}
          >
            {removing ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

export default BankCard
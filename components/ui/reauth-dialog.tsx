"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'

interface ReauthDialogProps {
  accounts: Account[]
}

const ReauthDialog = ({ accounts }: ReauthDialogProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const accountsNeedingReauth = accounts.filter(acc => acc.needsReauth)

  useEffect(() => {
    // Auto-open dialog if there are accounts needing reauth
    if (accountsNeedingReauth.length > 0) {
      setIsOpen(true)
    }
  }, [accountsNeedingReauth.length])

  const handleGoToMyBanks = () => {
    setIsOpen(false)
    router.push('/my-banks')
  }

  if (accountsNeedingReauth.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-2 border-orange-500 bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-orange-900">Action Required: Bank Re-authentication</span>
          </DialogTitle>
          <DialogDescription className="pt-3">
            <div className="space-y-3">
              <p className="text-sm">
                {accountsNeedingReauth.length === 1
                  ? 'One of your bank accounts needs to be re-authenticated.'
                  : `${accountsNeedingReauth.length} of your bank accounts need to be re-authenticated.`
                }
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  Why is this happening?
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 text-amber-700">
                  <li>You changed your password at your bank</li>
                  <li>Your bank requires additional security verification</li>
                  <li>Your connection has expired</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  What should you do?
                </p>
                <p className="text-xs text-blue-700">
                  Go to <span className="font-semibold">My Banks</span> to re-authenticate each account, or remove accounts you no longer need.
                </p>
              </div>

              {accountsNeedingReauth.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Affected accounts:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {accountsNeedingReauth.map((acc) => (
                      <li key={acc.appwriteItemId} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        {acc.name} ({acc.mask})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleGoToMyBanks}
            className="w-full"
          >
            Go to My Banks
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            Remind Me Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReauthDialog

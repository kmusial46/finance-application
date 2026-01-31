'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { deleteUserAccount } from '@/lib/actions/user.actions'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'

const SettingsPage = () => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState('')

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError('')

    try {
      const user = await getLoggedInUser()
      
      if (!user) {
        setError('User not found. Please log in again.')
        setIsDeleting(false)
        return
      }

      const result = await deleteUserAccount({ userId: user.$id || user.userId })

      if (result?.error) {
        setError(result.error)
        setIsDeleting(false)
        return
      }

      setIsDialogOpen(false)
      router.push('/sign-in')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsDeleting(false)
      console.error('Error deleting account:', err)
    }
  }

  return (
    <div className='flex max-h-screen w-full flex-col gap-8 overflow-y-scroll bg-gray-25 p-8 xl:py-12'>
      <div className='header-box'>
        <h1 className='header-box-title'>Settings</h1>
        <p className='header-box-subtext'>Manage your account settings</p>
      </div>

      <div className='flex flex-col gap-6 max-w-2xl'>
        {/* Danger Zone */}
        <div className='rounded-lg border border-red-200 bg-red-25 p-6'>
          <div className='flex items-start gap-4'>
            <div className='flex-center size-12 rounded-full bg-red-100'>
              <AlertTriangle className='size-6 text-red-600' />
            </div>
            <div className='flex-1'>
              <h2 className='text-18 font-semibold text-gray-900 mb-2'>Danger Zone</h2>
              <p className='text-14 text-gray-600 mb-4'>
                Once you delete your account, there is no going back. This action cannot be undone.
              </p>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant='destructive' 
                    className='gap-2 bg-red-600 text-white hover:bg-red-700'
                  >
                    <Trash2 className='size-4' />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription className='pt-2'>
                      This will permanently delete your account and remove all of your data from our servers. 
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {error && (
                    <div className='rounded-md bg-red-50 p-3 border border-red-200'>
                      <p className='text-sm text-red-600'>{error}</p>
                    </div>
                  )}

                  <DialogFooter className='gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant='destructive'
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className='gap-2 bg-red-600 text-white hover:bg-red-700'
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className='size-4 animate-spin' />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className='size-4' />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

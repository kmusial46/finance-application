'use client'

import { logoutAccount } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Footer = ({user, type = 'desktop', onRequestClose}: FooterProps) => {
    const router = useRouter()

    const handleLogOut = async () => {
        await logoutAccount()
        router.push('/sign-in')
    }

  return (
    <footer className={cn('footer', type === 'mobile' && '!justify-center gap-6 py-4')}>
        {type === 'mobile' ? (
            <>
                <Button asChild variant='ghost' size='icon-lg'>
                    <Link href='/settings' aria-label='Settings' onClick={onRequestClose}>
                        <Image src='/icons/settings.svg' width={28} height={28} alt='' />
                        <span className='sr-only'>Settings</span>
                    </Link>
                </Button>
                <Button
                    variant='ghost'
                    size='icon-lg'
                    onClick={async () => {
                        onRequestClose?.()
                        await handleLogOut()
                    }}
                    aria-label='Logout'
                >
                    <Image src='/icons/logout.svg' width={28} height={28} alt='' />
                    <span className='sr-only'>Logout</span>
                </Button>
            </>
        ) : (
            <>
                <div className='footer_email'>
                    <h1 className='text-14 truncate font-semibold text-gray-700'>
                        {user?.firstName ?? user?.name?.split(' ')[0] ?? ''} {user?.lastName ?? user?.name?.split(' ')[1] ?? ''}
                    </h1>
                    <p className='text-14 truncate font-normal text-gray-600'>
                        {user?.email}
                    </p>
                </div>

                <div className='flex items-center gap-4'>
                    <Link href='/settings' className='footer_image'>
                        <Image 
                            src="/icons/settings.svg"
                            fill
                            alt='settings'
                        />
                    </Link>
                    <div className='footer_image' onClick={handleLogOut}>
                        <Image 
                            src="/icons/logout.svg"
                            fill
                            alt='logout'
                        />
                    </div>
                </div>
            </>
        )}
    </footer>
  )
}

export default Footer
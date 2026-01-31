'use client'

import { logoutAccount } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Footer = ({user, type = 'desktop'}: FooterProps) => {
    const router = useRouter()

    const handleLogOut = async () => {
        await logoutAccount()
        router.push('/sign-in')
    }

  return (
    <footer className='footer'>
        <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
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
    </footer>
  )
}

export default Footer
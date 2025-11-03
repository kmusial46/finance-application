'use client'

import { logoutAccount } from '@/lib/actions/user.actions'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const Footer = ({user, type = 'desktop'}: FooterProps) => {
    const router = useRouter()

    const handleLogOut = async () => {
        await logoutAccount()
        router.push('/sign-in')
    }

  return (
    <footer className='footer'>
        <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
            <p className='text-xl font-bold text-gray-700'>
                {
                  // user may exist but firstName can be undefined; guard the access.
                  // Prefer firstName initial, fall back to first word of `name`, else empty string.
                  user?.firstName?.[0] ?? user?.name?.split(' ')[0]?.[0] ?? ''
                }
            </p>
        </div>

        <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
            <h1 className='text-14 truncate font-semibold text-gray-700'>
                {user?.firstName ?? user?.name?.split(' ')[0] ?? ''} {user?.lastName ?? user?.name?.split(' ')[1] ?? ''}
            </h1>
            <p className='text-14 truncate font-normal text-gray-600'>
                {user?.email}
            </p>
        </div>

        <div className='footer_image' onClick={handleLogOut}>
            <Image 
                src="icons/logout.svg"
                fill
                alt='logout'
            />
        </div>
    </footer>
  )
}

export default Footer
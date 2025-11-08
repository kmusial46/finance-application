"use client"

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from './button'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation'
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions'

const PlaidLink = ({user, variant}: PlaidLinkProps) => {
  const router = useRouter()

  const [token, setToken] = useState('')

  useEffect(() => {
    if (!user || (!user.$id && !user.userId)) {
      return
    }

    const getLinkToken = async () => {
      const data = await createLinkToken(user)

      if (data?.linkToken) {
        setToken(data.linkToken)
      } else if (data?.error) {
        console.error('Failed to fetch Plaid link token:', data.error)
      }
    }

    getLinkToken()
  }, [user])

  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    await exchangePublicToken({
      publicToken: public_token,
      user
    })

    router.push('/')
  }, [user])

  const config: PlaidLinkOptions = {
    token,
    onSuccess
  }

  const { open, ready } = usePlaidLink(config)

  return (
    <>
      {variant === 'primary' ? (
        <Button 
        onClick={() => open()}
        disabled={!ready}
        className='plaidlink-primary'>
          Connect Bank
        </Button>
        ): variant === 'ghost' ? (
          <Button onClick={() => open()}  variant='ghost'
            className='plaidlink-ghost'>
            <Image 
                src="/icons/connect-bank.svg"
                alt="Connect Bank"
                width={24}
                height={24}
              />
            <p className='hidden text-[16px] font-semibold text-black-2 xl:block'>
              Connect Bank
            </p>
          </Button>
        ): (
          <Button onClick={() => open()} 
            className='plaidlink-default'>
              <Image 
                src="/icons/connect-bank.svg"
                alt="Connect Bank"
                width={24}
                height={24}
              />
            <p className='text-[16px] font-semibold text-black-2'>
              Connect Bank
            </p>
          </Button>
        )
    }
    </>
  )
}

export default PlaidLink
"use client"

const ReauthAlert = ({ accounts }: ReauthAlertProps) => {
  const accountsNeedingReauth = accounts.filter(acc => acc.needsReauth)

  if (accountsNeedingReauth.length === 0) return null

  return (
    <div className='mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>
          <svg className='w-5 h-5 text-amber-600 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
            <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
          </svg>
        </div>
        <div className='flex-1'>
          <h3 className='text-sm font-semibold text-amber-800 mb-1'>
            Re-authentication Required
          </h3>
          <p className='text-sm text-amber-700 mb-2'>
            {accountsNeedingReauth.length === 1 
              ? 'One of your bank accounts requires re-authentication.' 
              : `${accountsNeedingReauth.length} of your bank accounts require re-authentication.`
            }
          </p>
          <p className='text-xs text-amber-600'>
            This typically happens when you change your password at your bank or when additional security verification is required. 
            Please reconnect your account to continue accessing your financial data.
          </p>
          {accountsNeedingReauth.length > 0 && (
            <ul className='mt-2 text-xs text-amber-700 list-disc list-inside'>
              {accountsNeedingReauth.map((acc) => (
                <li key={acc.appwriteItemId}>
                  {acc.name} ({acc.mask})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReauthAlert

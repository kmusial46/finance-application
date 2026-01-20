import BankCard from '@/components/ui/bank-card';
import HeaderBox from '@/components/ui/header-box'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({userId: loggedIn.$id});

  const accountsData = Array.isArray(accounts?.data) ? accounts.data : [];
  const accountsNeedingReauth = accountsData.filter((acc: any) => acc.needsReauth);
  const validAccounts = accountsData.filter((acc: any) => !acc.needsReauth);

  return (
    <section className='flex'>
      <div className='my-banks'>
        <HeaderBox
          title='My Bank Accounts'
          subtext='Manage your bank accounts effortlessly.'
        />

        {accountsNeedingReauth.length > 0 && (
          <div className='mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <svg className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
              </svg>
              <div>
                <h3 className='text-sm font-semibold text-amber-800 mb-1'>
                  {accountsNeedingReauth.length} {accountsNeedingReauth.length === 1 ? 'account needs' : 'accounts need'} re-authentication
                </h3>
                <p className='text-xs text-amber-700'>
                  Click "Re-authenticate" on the affected cards below to reconnect, or "Remove" to delete accounts you no longer need.
                </p>
              </div>
            </div>
          </div>
        )}

        {accountsNeedingReauth.length > 0 && (
          <div className='space-y-4 mb-8'>
            <h2 className='header-2 text-amber-700'>
              Requires Attention ({accountsNeedingReauth.length})
            </h2>
            <div className='flex flex-wrap gap-6'>
              {accountsNeedingReauth.map((account: Account) => (
                <BankCard 
                  key={account.id} 
                  account={account} 
                  username={loggedIn?.firstName || loggedIn?.name?.split(' ')[0] || ''}
                />
              ))}
            </div>
          </div>
        )}

        <div className='space-y-4'>
          <h2 className='header-2'>
            {validAccounts.length > 0 ? 'Active Accounts' : 'Your Cards'}
          </h2>
          {validAccounts.length > 0 ? (
            <div className='flex flex-wrap gap-6'>
              {validAccounts.map((account: Account) => (
                <BankCard 
                  key={account.id} 
                  account={account} 
                  username={loggedIn?.firstName || loggedIn?.name?.split(' ')[0] || ''}
                />
              ))}
            </div>
          ) : accountsNeedingReauth.length === 0 ? (
            <p className='text-sm text-gray-500'>No bank accounts connected yet.</p>
          ) : (
            <p className='text-sm text-gray-500'>All your accounts require re-authentication.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default MyBanks
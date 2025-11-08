import BankCard from '@/components/ui/bank-card';
import HeaderBox from '@/components/ui/header-box'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({userId: loggedIn.$id});

  return (
    <section className='flex'>
      <div className='my-banks'>
        <HeaderBox
          title='My Bank Accounts'
          subtext='Manage your bank accounts effortlessly.'
        />

        <div className='space-y-4'>
          <h2 className='header-2'>
            Your Cards
          </h2>
          <div className='flex flex-wrap gap-6'>
            {accounts && accounts?.data?.map((account: Account) => (
              <BankCard 
                key={account.id} 
                account={account} 
                username={loggedIn?.firstName || loggedIn?.name?.split(' ')[0] || ''}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MyBanks
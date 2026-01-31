import AccountBreakdown from '@/components/ui/account-breakdown';
import HeaderBox from '@/components/ui/header-box';
import RightSidebar from '@/components/sidebars/right-sidebar';
import TotalBalanceBox from '@/components/ui/total-balance-box';
import ReauthDialog from '@/components/ui/reauth-dialog';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Home = async ({ searchParams }: SearchParamProps) => {
    const { id, page } = (await searchParams) ?? {};

    const currentPage = Number(page as string) || 1;
    const loggedIn = await getLoggedInUser();
    const accounts = await getAccounts({userId: loggedIn.$id});

    // Handle complete failure (no accounts at all)
    if (!accounts || ((accounts as any)?.error && !accounts?.data)) {
        try {
            console.error('getAccounts error:', JSON.stringify((accounts as any)?.error, null, 2));
        } catch (e) {
            console.error('getAccounts error (non-serialisable):', (accounts as any)?.error);
        }
        return (
            <section className='home'>
                <div className='home-content'>
                    <header className='home-header'>
                        <HeaderBox 
                            type='greeting'
                            title='Welcome'
                            user={loggedIn?.firstName ?? loggedIn?.name?.split(' ')[0] ?? ''}
                            subtext='Unable to load your accounts. Please try again later.'
                        />
                    </header>
                    <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-red-800'>Error loading accounts. Some accounts may require re-authentication.</p>
                    </div>
                </div>
            </section>
        );
    }

    // Log partial errors if some accounts failed
    if ((accounts as any)?.partialErrors) {
        console.warn('Some accounts failed to load:', (accounts as any).partialErrors);
    }

    const accountsData = Array.isArray(accounts?.data) ? accounts.data : [];
    
    // Filter out accounts that need re-authentication for default selection
    const validAccounts = accountsData.filter((acc: any) => !acc.needsReauth);
    const appwriteItemId = typeof id === 'string' && id.length > 0
        ? id
        : (validAccounts[0]?.appwriteItemId ?? accountsData[0]?.appwriteItemId);

    const account = appwriteItemId
        ? await getAccount({ appwriteItemId })
        : null;

    if (account?.error) {
        try {
            console.error('getAccount error:', JSON.stringify(account.error, null, 2));
        } catch (e) {
            console.error('getAccount error (non-serialisable):', account.error);
        }
    }

    return (
        <section className='home'>
            <div className='home-content'>
                <header className='home-header'>
                    <HeaderBox 
                        type='greeting'
                        title='Welcome'
                        user={loggedIn?.firstName ?? loggedIn?.name?.split(' ')[0] ?? ''}
                        subtext='Access your account overview and manage your finances.'
                    />

                    <TotalBalanceBox 
                        accounts={validAccounts}
                        totalBanks={accounts?.totalBanks}
                        totalCurrentBalance={accounts?.totalCurrentBalance}
                    />
                </header>

                <AccountBreakdown 
                    transactions={account?.transactions}
                />
            </div>

            <RightSidebar  
                user={loggedIn}
                transactions={account?.transactions}
                banks={validAccounts?.slice(0, 2)}
            />

            <ReauthDialog accounts={accountsData} />
        </section>
    );
}

export default Home;
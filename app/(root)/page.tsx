import RecentTransactions from '@/components/ui/recent-transactions';
import HeaderBox from '@/components/ui/header-box';
import RightSidebar from '@/components/ui/right-sidebar';
import TotalBalanceBox from '@/components/ui/total-balance-box';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Home = async ({ searchParams }: SearchParamProps) => {
    const { id, page } = (await searchParams) ?? {};

    const currentPage = Number(page as string) || 1;
    const loggedIn = await getLoggedInUser();
    const accounts = await getAccounts({userId: loggedIn.$id});

    if(!accounts) return

    const accountsData = accounts?.data;
    const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

    const account = await getAccount({ appwriteItemId });

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
                        accounts={accountsData}
                        totalBanks={accounts?.totalBanks}
                        totalCurrentBalance={accounts?.totalCurrentBalance}
                    />
                </header>

                <RecentTransactions 
                    accounts={accountsData}
                    transactions={account?.transactions}
                    appwriteItemId={appwriteItemId}
                    page={currentPage}
                />
            </div>

            <RightSidebar  
                user={loggedIn}
                transactions={account?.transactions}
                banks={accountsData?.slice(0, 2)}
            />
        </section>
    );
}

export default Home;
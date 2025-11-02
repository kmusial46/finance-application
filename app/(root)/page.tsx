import HeaderBox from '@/components/ui/header-box';
import RightSidebar from '@/components/ui/right-sidebar';
import TotalBalanceBox from '@/components/ui/total-balance-box';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Home = async () => {
    const loggedIn = await getLoggedInUser();

    return (
        <section className='home'>
            <div className='home-content'>
                <header className='home-header'>
                    <HeaderBox 
                        type='greeting'
                        title='Welcome'
                        user={loggedIn?.name || 'Guest'}
                        subtext='Access your account overview and manage your finances.'
                    />

                    <TotalBalanceBox 
                        accounts={[]}
                        totalBanks={1}
                        totalCurrentBalance={1250.73}
                    />
                </header>

                RECENT TRANSACTIONS
            </div>

            <RightSidebar  
                user={loggedIn}
                transactions={[]}
                banks={[{currentBalance: 123.50}, {currentBalance: 500.00}]}
            />
        </section>
    );
}

export default Home;
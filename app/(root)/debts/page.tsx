import HeaderBox from '@/components/ui/header-box';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getDebts } from '@/lib/actions/bills-debts.actions';
import DebtsList from '@/components/bills-debts/debts-list';
import DebtSummary from '@/components/bills-debts/debt-summary';
import { AddDebtDialog } from '@/components/bills-debts/add-debt-dialog';

const DebtsPage = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const debts = await getDebts({ userId: loggedIn.$id });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="title"
            title="Debts & Loans"
            subtext="Track your debt payoff progress and manage your loans."
            user={loggedIn.firstName}
          />
        </header>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="transform transition-all hover:scale-105">
            <AddDebtDialog userId={loggedIn.$id} />
          </div>
        </div>

        {/* Mobile: collapsible summary above cards */}
        <details className="md:hidden mb-4">
          <summary className="cursor-pointer text-sm text-gray-700">Summary</summary>
          <div className="mt-3">
            <DebtSummary debts={debts} />
          </div>
        </details>

        {/* Desktop: two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <DebtsList debts={debts} />
          </div>
          <aside className="hidden md:block md:col-span-1">
            <DebtSummary debts={debts} />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default DebtsPage;

import HeaderBox from '@/components/ui/header-box';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getBills, getDebts } from '@/lib/actions/bills-debts.actions';
import BillsList from '@/components/bills-debts/bills-list';
import DebtsList from '@/components/bills-debts/debts-list';
import DebtSummary from '@/components/bills-debts/debt-summary';
import BillsMetrics from '@/components/bills-debts/bills-metrics';
import BillsAlerts from '@/components/bills-debts/bills-alerts';
import BillsTrendChart from '@/components/bills-debts/bills-trend-chart';
import { AddBillDialog } from '@/components/bills-debts/add-bill-dialog';
import { AddDebtDialog } from '@/components/bills-debts/add-debt-dialog';
import { ScanBillsPrompt } from '@/components/bills-debts/scan-bills-prompt';
import { ScanBillsButton } from '@/components/bills-debts/scan-bills-button';

const BillsAndDebts = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const bills = await getBills({ userId: loggedIn.$id });
  const debts = await getDebts({ userId: loggedIn.$id });

  // Build 6-month trend data (approx) using bill creation date to show growth
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const total = bills
      .filter((b: Bill) => new Date(b.$createdAt) <= end && b.status === 'active')
      .reduce((s: number, b: Bill) => s + (b.amount || 0), 0);
    const subscription = bills
      .filter((b: Bill) => new Date(b.$createdAt) <= end && (b.category === 'subscription' || (b.category && b.category.toLowerCase().includes('sub'))))
      .reduce((s: number, b: Bill) => s + (b.amount || 0), 0);
    return { month: d.toLocaleString('default', { month: 'short', year: 'numeric' }), total, subscription };
  });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="title"
            title="Bills & Debts"
            subtext="Manage your recurring payments and track your debt payoff progress."
            user={loggedIn.firstName}
          />
          <div className="flex gap-2">
            <ScanBillsButton userId={loggedIn.$id} />
            <AddBillDialog userId={loggedIn.$id} />
            <AddDebtDialog userId={loggedIn.$id} />
          </div>
        </header>

        <ScanBillsPrompt userId={loggedIn.$id} billsCount={bills.length} />

        <div className="space-y-8">
          {/* Top row: Metrics and Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <BillsMetrics bills={bills} />
            </div>
            <div className="col-span-1">
              <BillsTrendChart data={months} />
            </div>
          </div>

          <div className="lg:flex lg:items-start lg:gap-6">
            <main className="lg:flex-1 lg:pr-4">
              <h2 className="text-2xl font-semibold text-gray-900">Bills & Subscriptions</h2>
              <div className="mt-4">
                <BillsList bills={bills} />
              </div>
            </main>
            <aside className="lg:w-96 lg:flex-none">
              <div className="sticky top-24">
                <BillsAlerts bills={bills} />
              </div>
            </aside>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Debts & Loans</h2>

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
        </div>
      </div>
    </section>
  );
};

export default BillsAndDebts;

import HeaderBox from '@/components/ui/header-box';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getBills } from '@/lib/actions/bills-debts.actions';
import BillsList from '@/components/bills/bills-list';
import BillsMetrics from '@/components/bills/bills-metrics';
import BillsAlerts from '@/components/bills/bills-alerts';
import BillsTrendChart from '@/components/bills/bills-trend-chart';
import { AddBillDialog } from '@/components/bills/add-bill-dialog';
import { ScanBillsPrompt } from '@/components/bills/scan-bills-prompt';
import { ScanBillsButton } from '@/components/bills/scan-bills-button';

export const dynamic = 'force-dynamic';

const BillsPage = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const bills = await getBills({ userId: loggedIn.$id });

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
            title="Bills & Subscriptions"
            subtext="Manage your recurring payments and track your subscriptions."
            user={loggedIn.firstName}
          />
        </header>

        <ScanBillsPrompt userId={loggedIn.$id} billsCount={bills.length} />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="transform transition-all hover:scale-105">
            <AddBillDialog userId={loggedIn.$id} />
          </div>
          <ScanBillsButton userId={loggedIn.$id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
      </div>
    </section>
  );
};

export default BillsPage;

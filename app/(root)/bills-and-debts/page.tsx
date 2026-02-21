import HeaderBox from '@/components/ui/header-box';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getBills, getDebts } from '@/lib/actions/bills-debts.actions';
import BillsList from '@/components/bills/bills-list';
import DebtsList from '@/components/debts/debts-list';
import DebtSummary from '@/components/debts/debt-summary';
import BillsMetrics from '@/components/bills/bills-metrics';
import BillsAlerts from '@/components/bills/bills-alerts';
import BillsTrendChart from '@/components/bills/bills-trend-chart';
import { AddBillDialog } from '@/components/bills/add-bill-dialog';
import { AddDebtDialog } from '@/components/debts/add-debt-dialog';
import { ScanBillsPrompt } from '@/components/bills/scan-bills-prompt';
import { ScanBillsButton } from '@/components/bills/scan-bills-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

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
        </header>

        <ScanBillsPrompt userId={loggedIn.$id} billsCount={bills.length} />

        <Tabs defaultValue="bills" className="w-fit">
          <div className="inline-block p-4 bg-blue-100 rounded-lg border border-blue-200 shadow-sm mb-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-2 h-12 bg-white/70 backdrop-blur-sm shadow-md">
              <TabsTrigger 
                value="bills" 
                className="text-base font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                Bills & Subscriptions
              </TabsTrigger>
              <TabsTrigger 
                value="debts"
                className="text-base font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
              >
                Debts & Loans
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bills" className="space-y-8 mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="transform transition-all hover:scale-105">
                <AddBillDialog userId={loggedIn.$id} />
              </div>
              <ScanBillsButton userId={loggedIn.$id} />
            </div>

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
          </TabsContent>

          <TabsContent value="debts" className="space-y-6 mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="transform transition-all hover:scale-105">
                <AddDebtDialog userId={loggedIn.$id} />
              </div>
            </div>

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
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default BillsAndDebts;

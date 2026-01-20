import HeaderBox from '@/components/ui/header-box';
import { getInvestments } from '@/lib/actions/investment.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getQuote } from '@/lib/actions/finnhub.actions';
import PortfolioSummary from '@/components/investments/portfolio-summary';
import InvestmentsTrendChart from '@/components/investments/investments-trend-chart';
import InvestmentTable from '@/components/investments/investment-table';
import AllocationChart from '@/components/investments/allocation-chart';
import AddInvestmentDialog from '@/components/investments/add-investment-dialog';

const InvestmentsPage = async () => {
  const user = await getLoggedInUser();
  const response = await getInvestments({ userId: user.$id });
  const investments: Investment[] = Array.isArray(response?.data) ? response.data : [];

  // Get unique symbols
  const uniqueSymbols = Array.from(new Set(investments.map((inv) => inv.symbol)));

  // Fetch quotes in parallel
  const quotesMap: Record<string, number> = {};
  await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      const quote = await getQuote(symbol);
      if (quote && quote.price) {
        quotesMap[symbol] = quote.price;
      }
    })
  );

  // Aggregate holdings
  const holdingsMap: Record<string, Holding> = {};

  investments.forEach((inv) => {
    const currentPrice = quotesMap[inv.symbol] || 0;
    const cost = inv.pricePerShare * inv.shareCount;
    const marketValue = currentPrice * inv.shareCount;

    if (!holdingsMap[inv.symbol]) {
      holdingsMap[inv.symbol] = {
        symbol: inv.symbol,
        name: inv.name,
        totalShares: 0,
        avgCost: 0,
        totalCost: 0,
        currentPrice,
        marketValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        allocation: 0,
      };
    }

    const h = holdingsMap[inv.symbol];
    h.totalShares += inv.shareCount;
    h.totalCost += cost;
    h.marketValue += marketValue;
  });

  // Finalise holdings calculations
  const holdings = Object.values(holdingsMap).map((h) => {
    h.avgCost = h.totalShares > 0 ? h.totalCost / h.totalShares : 0;
    h.totalReturn = h.marketValue - h.totalCost;
    h.totalReturnPercent = h.totalCost > 0 ? (h.totalReturn / h.totalCost) * 100 : 0;
    return h;
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalReturn = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  // Calculate allocation
  holdings.forEach((h) => {
    h.allocation = totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0;
  });

  // Build 6-month trend data
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Calculate portfolio value at that point in time
    const investmentsAtDate = investments.filter((inv: Investment) => new Date(inv.$createdAt) <= end);
    const symbolsAtDate = Array.from(new Set(investmentsAtDate.map((inv) => inv.symbol)));
    
    // Aggregate for that month
    const holdingsAtDate: Record<string, { shares: number; cost: number }> = {};
    investmentsAtDate.forEach((inv: Investment) => {
      if (!holdingsAtDate[inv.symbol]) {
        holdingsAtDate[inv.symbol] = { shares: 0, cost: 0 };
      }
      holdingsAtDate[inv.symbol].shares += inv.shareCount;
      holdingsAtDate[inv.symbol].cost += inv.pricePerShare * inv.shareCount;
    });

    // Use current prices for simplicity (in reality, you'd want historical prices)
    const portfolioValue = Object.keys(holdingsAtDate).reduce((sum, symbol) => {
      const currentPrice = quotesMap[symbol] || 0;
      return sum + (currentPrice * holdingsAtDate[symbol].shares);
    }, 0);

    const totalCostAtDate = Object.values(holdingsAtDate).reduce((sum, h) => sum + h.cost, 0);

    return {
      month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      portfolioValue,
      totalCost: totalCostAtDate,
    };
  });

  return (
    <section className="flex flex-col gap-8 bg-gray-25 p-8 xl:py-12">
      <div className="flex justify-between items-center">
        <HeaderBox
          title="Investments"
          subtext="Monitor your holdings, allocations, and total portfolio value."
        />
        <AddInvestmentDialog userId={user.$id} />
      </div>

      <PortfolioSummary
        totalValue={totalValue}
        totalCost={totalCost}
        totalReturn={totalReturn}
        totalReturnPercent={totalReturnPercent}
        positionCount={holdings.length}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <InvestmentsTrendChart data={months} />
        <AllocationChart holdings={holdings} />
      </div>

      <InvestmentTable holdings={holdings} investments={investments} userId={user.$id} />
    </section>
  );
};

export default InvestmentsPage;

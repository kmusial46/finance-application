import HeaderBox from '@/components/ui/header-box';
import InvestmentForm from '@/components/ui/investment-form';
import InvestmentTable from '@/components/ui/investment-table';
import PortfolioPieChart from '@/components/ui/portfolio-pie-chart';
import { getInvestments } from '@/lib/actions/investment.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { formatAmount } from '@/lib/utils';

const InvestmentsPage = async () => {
	const user = await getLoggedInUser();

	const response = await getInvestments({ userId: user.$id });
	const investments: Investment[] = Array.isArray(response?.data) ? response.data : [];
	const errorMessage = typeof response?.error === 'string' ? response.error : null;

	const totalValue = investments.reduce((sum, investment) => {
		const unitPrice = Number(investment.pricePerShare) || 0;
		const shares = Number(investment.shareCount) || 0;
		return sum + unitPrice * shares;
	}, 0);

	const buildMonthlySeries = (records: Investment[], months = 12) => {
		if (!records.length) {
			const now = new Date();
			return Array.from({ length: months }, (_, index) => {
				const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
				return {
					label: monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
					value: 0,
				};
			});
		}

		const now = new Date();
		const monthsToDisplay = Math.max(months, 1);
		const buckets = Array.from({ length: monthsToDisplay }, (_, index) => {
			const monthStart = new Date(now.getFullYear(), now.getMonth() - (monthsToDisplay - 1 - index), 1);
			const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
			return {
				label: monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
				end: monthEnd,
			};
		});

		const datedHoldings = records
			.map((investment) => {
				const shares = Number(investment.shareCount) || 0;
				const price = Number(investment.pricePerShare) || 0;
				const createdAt = new Date(investment.$createdAt);

				if (Number.isNaN(createdAt.getTime())) {
					return null;
				}

				return {
					createdAt,
					value: shares * price,
				};
			})
			.filter((entry): entry is { createdAt: Date; value: number } => Boolean(entry))
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

		let runningTotal = 0;
		let cursor = 0;

		return buckets.map((bucket) => {
			while (
				cursor < datedHoldings.length &&
				datedHoldings[cursor].createdAt.getTime() <= bucket.end.getTime()
			) {
				runningTotal += datedHoldings[cursor].value;
				cursor += 1;
			}

			return {
				label: bucket.label,
				value: Math.max(Number(runningTotal.toFixed(2)), 0),
			};
		});
	};

	const monthlyPerformance = buildMonthlySeries(investments, 12);

	return (
		<section className="flex flex-col gap-8 bg-gray-25 p-8 xl:py-12">
			<HeaderBox title="Investments" subtext="Monitor your holdings, allocations, and total portfolio value." />

			<div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
				<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-start">
						<div>
							<h2 className="text-18 font-semibold text-gray-900">Portfolio Performance</h2>
							<p className="text-14 text-gray-600">Track how your portfolio&apos;s total market value changes month over month.</p>
						</div>
						<div className="text-right md:ml-6 lg:ml-12">
							<p className="text-12 uppercase text-gray-500">Total Value</p>
							<p className="text-20 font-semibold text-gray-900">{formatAmount(totalValue)}</p>
						</div>
					</div>

					<div className="flex min-h-[260px] items-center justify-center">
						<PortfolioPieChart data={monthlyPerformance} />
					</div>

					{errorMessage && <p className="mt-4 text-14 text-red-500">{errorMessage}</p>}
				</div>

				<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<InvestmentForm userId={user.$id} />
				</div>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
				<div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-start">
					<div>
						<h2 className="text-18 font-semibold text-gray-900">Holdings</h2>
						<p className="text-14 text-gray-600">Keep track of price per share, share count, and individual market value.</p>
					</div>
					<div className="flex flex-wrap gap-4 text-sm text-gray-600 md:ml-6 lg:ml-12">
						<span>Positions: {investments.length}</span>
						<span>Total Value: {formatAmount(totalValue)}</span>
					</div>
				</div>

				<InvestmentTable investments={investments} totalValue={totalValue} userId={user.$id} />
			</div>
		</section>
	);
};

export default InvestmentsPage;

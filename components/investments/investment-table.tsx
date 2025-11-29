'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/investments/investments-history';
import { deleteInvestment } from '@/lib/actions/investment.actions';
import { formatAmount } from '@/lib/utils';

interface InvestmentTableProps {
  investments: Investment[];
  totalValue: number;
  userId: string;
}

const InvestmentTable = ({ investments, totalValue, userId }: InvestmentTableProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');

  const trimmedSearch = searchTerm.trim();

  const filteredInvestments = useMemo(() => {
    const term = trimmedSearch.toLowerCase();

    if (!term) {
      return investments;
    }

    return investments.filter((investment) => {
      const symbol = investment.symbol?.toLowerCase() ?? '';
      const name = investment.name?.toLowerCase() ?? '';

      return symbol.includes(term) || name.includes(term);
    });
  }, [investments, trimmedSearch]);

  const usingFilteredView = trimmedSearch.length > 0;
  const visibleTotalValue = useMemo(() => {
    if (!usingFilteredView) {
      return totalValue;
    }

    return filteredInvestments.reduce((sum, investment) => {
      const shares = Number(investment.shareCount) || 0;
      const price = Number(investment.pricePerShare) || 0;
      return sum + shares * price;
    }, 0);
  }, [filteredInvestments, totalValue, usingFilteredView]);

  const visibleInvestments = filteredInvestments;

  const safeTotal = visibleTotalValue > 0 ? visibleTotalValue : 0;

  const handleDelete = (investmentId: string) => {
    setServerError(null);
    setPendingId(investmentId);

    startTransition(() => {
      deleteInvestment({ investmentId, userId })
        .then((response) => {
          if (response?.error) {
            const message = typeof response.error === 'string' ? response.error : 'Unable to delete investment.';
            setServerError(message);
            return;
          }

          router.refresh();
        })
        .finally(() => {
          setPendingId(null);
        });
    });
  };

  const renderBody = () => {
    if (!visibleInvestments.length) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-6 text-center text-sm text-gray-500">
            {usingFilteredView
              ? 'No holdings match your search. Try a different ticker or company name.'
              : 'No holdings yet. Add your first investment above.'}
          </TableCell>
        </TableRow>
      );
    }

    return visibleInvestments.map((investment) => {
      const unitPrice = Number(investment.pricePerShare) || 0;
      const shares = Number(investment.shareCount) || 0;
      const marketValue = unitPrice * shares;
      const allocation = safeTotal > 0 ? (marketValue / safeTotal) * 100 : 0;

      return (
        <TableRow key={investment.$id}>
          <TableCell className="font-semibold uppercase">{investment.symbol}</TableCell>
          <TableCell className="max-w-[200px] sm:max-w-[320px] md:max-w-[420px] truncate" title={investment.name}>
            {investment.name}
          </TableCell>
          <TableCell>{formatAmount(unitPrice)}</TableCell>
          <TableCell>{shares.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</TableCell>
          <TableCell>{formatAmount(marketValue)}</TableCell>
          <TableCell>{`${allocation.toFixed(1)}%`}</TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(investment.$id)}
              disabled={isPending && pendingId === investment.$id}
            >
              {isPending && pendingId === investment.$id ? 'Removing…' : 'Remove'}
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Positions: {visibleInvestments.length}
            {usingFilteredView ? ` of ${investments.length}` : ''}
          </p>
          <p className="text-xs text-gray-600">
            {usingFilteredView ? 'Filtered holdings shown below.' : 'All holdings shown below.'}
          </p>
        </div>
        <div className="w-full sm:max-w-xs">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by ticker or company"
            aria-label="Search holdings by ticker or company"
          />
        </div>
      </div>

      {serverError && <p className="text-14 text-red-500">{serverError}</p>}

      {/* Responsive wrapper: allow horizontal scroll on small screens to avoid overlap */}
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <div className="min-w-[640px]">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Price / Share</TableHead>
            <TableHead>Shares</TableHead>
            <TableHead>Market Value</TableHead>
            <TableHead>Allocation</TableHead>
            
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderBody()}</TableBody>
        {visibleInvestments.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-right font-semibold">
                {usingFilteredView ? 'Filtered total value' : 'Total value'}
              </TableCell>
              <TableCell className="font-semibold">{formatAmount(safeTotal)}</TableCell>
              <TableCell>{safeTotal > 0 ? '100.0%' : '0.0%'}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
          </Table>
        </div>
      </div>
    </div>
  );
};

export default InvestmentTable;

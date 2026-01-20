'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/investments/investments-history';
import { formatAmount } from '@/lib/utils';
import InvestmentDetailsDialog from './investment-details-dialog';

interface InvestmentTableProps {
  holdings: Holding[];
  investments: Investment[];
  userId: string;
}

const InvestmentTable = ({ holdings, investments, userId }: InvestmentTableProps) => {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
              <TableHead className="text-right">Alloc %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => (
              <TableRow
                key={holding.symbol}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedHolding(holding)}
              >
                <TableCell className="font-medium">{holding.symbol}</TableCell>
                <TableCell>{holding.name}</TableCell>
                <TableCell className="text-right">{holding.totalShares}</TableCell>
                <TableCell className="text-right">{formatAmount(holding.avgCost)}</TableCell>
                <TableCell className="text-right">{formatAmount(holding.currentPrice)}</TableCell>
                <TableCell className="text-right">{formatAmount(holding.marketValue)}</TableCell>
                <TableCell className={`text-right ${holding.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(holding.totalReturn)} ({holding.totalReturnPercent.toFixed(2)}%)
                </TableCell>
                <TableCell className="text-right">{holding.allocation.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvestmentDetailsDialog
        isOpen={!!selectedHolding}
        onClose={() => setSelectedHolding(null)}
        holding={selectedHolding}
        investments={investments}
        userId={userId}
      />
    </>
  );
};

export default InvestmentTable;

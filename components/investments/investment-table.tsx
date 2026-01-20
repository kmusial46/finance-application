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
import RemoveSharesDialog from './remove-shares-dialog';
import { Button } from '@/components/ui/button';
import { TrendingDown } from 'lucide-react';

interface InvestmentTableProps {
  holdings: Holding[];
  investments: Investment[];
  userId: string;
}

const InvestmentTable = ({ holdings, investments, userId }: InvestmentTableProps) => {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [removeHolding, setRemoveHolding] = useState<Holding | null>(null);

  const handleRemoveClick = (holding: Holding, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemoveHolding(holding);
  };

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
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right">{holding.totalShares.toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatAmount(holding.avgCost)}</TableCell>
                <TableCell className="text-right">{formatAmount(holding.currentPrice)}</TableCell>
                <TableCell className="text-right">{formatAmount(holding.marketValue)}</TableCell>
                <TableCell className={`text-right ${holding.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(holding.totalReturn)} ({holding.totalReturnPercent.toFixed(2)}%)
                </TableCell>
                <TableCell className="text-right">{holding.allocation.toFixed(2)}%</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRemoveClick(holding, e)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Sell
                  </Button>
                </TableCell>
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

      <RemoveSharesDialog
        isOpen={!!removeHolding}
        onClose={() => setRemoveHolding(null)}
        holding={removeHolding}
        investments={investments}
        userId={userId}
      />
    </>
  );
};

export default InvestmentTable;

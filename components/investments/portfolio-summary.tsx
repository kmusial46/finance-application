import React from 'react';
import { formatAmount } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface PortfolioSummaryProps {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  positionCount: number;
}

const PortfolioSummary = ({
  totalValue,
  totalCost,
  totalReturn,
  totalReturnPercent,
  positionCount,
}: PortfolioSummaryProps) => {
  const isPositive = totalReturn >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAmount(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            {positionCount} active positions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAmount(totalCost)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Return ($)</CardTitle>
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{formatAmount(totalReturn)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Return (%)</CardTitle>
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{totalReturnPercent.toFixed(2)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioSummary;

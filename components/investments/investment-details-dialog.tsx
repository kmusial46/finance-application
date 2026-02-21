'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getStockMetrics, getStockProfile } from '@/lib/actions/finnhub.actions';
import { deleteInvestment } from '@/lib/actions/investment.actions';
import { formatAmount } from '@/lib/utils';
import TradingViewWidget from '@/components/tradingview-components/chart';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InvestmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  holding: Holding | null;
  investments: Investment[];
  userId: string;
}

const InvestmentDetailsDialog = ({
  isOpen,
  onClose,
  holding,
  investments,
  userId,
}: InvestmentDetailsDialogProps) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && holding) {
      const fetchData = async () => {
        const [m, p] = await Promise.all([
          getStockMetrics(holding.symbol),
          getStockProfile(holding.symbol),
        ]);
        setMetrics(m);
        setProfile(p);
      };
      fetchData();
    }
  }, [isOpen, holding]);

  if (!holding) return null;

  const lots = investments.filter((inv) => inv.symbol === holding.symbol);

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('Are you sure you want to remove this investment?')) return;
    
    startTransition(async () => {
      const response = await deleteInvestment({
        investmentId: lotId,
        userId,
      });

      if (!response?.error) {
        router.refresh();
        // If no more lots for this symbol, close the dialog
        if (lots.length === 1) {
          onClose();
        }
      } else {
        alert(response.error);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white !w-[calc(100vw-2rem)] sm:!w-[90vw] md:!w-[85vw] lg:!w-[1200px] !max-w-[1200px] !p-4 sm:!p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex flex-col items-start gap-1 text-gray-900 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-base font-semibold sm:text-lg">
              {holding.symbol} - {holding.name}
            </span>
            <span className="text-xs font-normal text-gray-500 sm:text-sm">
              {profile?.exchange}
            </span>
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            Current Price: {formatAmount(holding.currentPrice)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:gap-6 sm:py-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
            <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
              <p className="text-xs text-gray-500 sm:text-sm">Total Value</p>
              <p className="text-base font-semibold sm:text-lg">{formatAmount(holding.marketValue)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
              <p className="text-xs text-gray-500 sm:text-sm">Total Return</p>
              <p className={`text-base font-semibold sm:text-lg ${holding.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(holding.totalReturn)} ({holding.totalReturnPercent.toFixed(2)}%)
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
              <p className="text-xs text-gray-500 sm:text-sm">Avg Cost</p>
              <p className="text-base font-semibold sm:text-lg">{formatAmount(holding.avgCost)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
              <p className="text-xs text-gray-500 sm:text-sm">Shares</p>
              <p className="text-base font-semibold sm:text-lg">{holding.totalShares}</p>
            </div>
          </div>

          {/* Fundamentals */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
              <div>
                <p className="text-xs text-gray-500">Market Cap</p>
                <p className="font-medium">{metrics['marketCapitalization'] ? `$${metrics['marketCapitalization']}M` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P/E Ratio</p>
                <p className="font-medium">{metrics['peTTM']?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">52W High</p>
                <p className="font-medium">{metrics['52WeekHigh'] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">52W Low</p>
                <p className="font-medium">{metrics['52WeekLow'] || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="w-full">
            <TradingViewWidget
              scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
              config={{
                width: "100%",
                height: 520,
                symbol: holding.symbol,
                interval: "D",
                timezone: "Etc/UTC",
                theme: "light",
                style: "1",
                locale: "en",
                toolbar_bg: "#f1f3f6",
                enable_publishing: false,
                allow_symbol_change: true,
                support_host: "https://www.tradingview.com"
              }}
              height={520}
            />
          </div>

          {/* Purchase Lots */}
          <div>
            <h3 className="mb-2 text-sm font-semibold sm:text-base">Purchase History</h3>
            <div className="max-w-full overflow-x-auto rounded-md border">
              <table className="min-w-[640px] w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-right">Shares</th>
                    <th className="p-2 text-right">Cost/Share</th>
                    <th className="p-2 text-right">Total Cost</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.$id} className="border-t">
                      <td className="p-2">{new Date(lot.purchaseDate).toLocaleDateString()}</td>
                      <td className="p-2 text-right">{lot.shareCount}</td>
                      <td className="p-2 text-right">{formatAmount(lot.pricePerShare)}</td>
                      <td className="p-2 text-right">{formatAmount(lot.shareCount * lot.pricePerShare)}</td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLot(lot.$id)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentDetailsDialog;

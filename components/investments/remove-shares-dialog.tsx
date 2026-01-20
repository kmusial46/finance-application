'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteInvestment, updateInvestment } from '@/lib/actions/investment.actions';
import { formatAmount } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface RemoveSharesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  holding: Holding | null;
  investments: Investment[];
  userId: string;
}

const RemoveSharesDialog = ({
  isOpen,
  onClose,
  holding,
  investments,
  userId,
}: RemoveSharesDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [removeType, setRemoveType] = useState<'shares' | 'value'>('shares');
  const [removeAmount, setRemoveAmount] = useState('');
  const router = useRouter();

  if (!holding) return null;

  const lots = investments.filter((inv) => inv.symbol === holding.symbol).sort(
    (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
  );

  const handleRemove = async () => {
    const amount = parseFloat(removeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (removeType === 'shares') {
      if (amount > holding.totalShares) {
        alert(`You only have ${holding.totalShares} shares available`);
        return;
      }
    } else {
      const maxValue = holding.totalShares * holding.currentPrice;
      if (amount > maxValue) {
        alert(`Maximum value you can remove is ${formatAmount(maxValue)}`);
        return;
      }
    }

    startTransition(async () => {
      let remainingToRemove = removeType === 'shares' ? amount : amount / holding.currentPrice;

      // Process lots in FIFO order
      for (const lot of lots) {
        if (remainingToRemove <= 0) break;

        if (lot.shareCount <= remainingToRemove) {
          // Remove entire lot
          const response = await deleteInvestment({
            investmentId: lot.$id,
            userId,
          });

          if (response?.error) {
            alert(response.error);
            return;
          }

          remainingToRemove -= lot.shareCount;
        } else {
          // Partial removal - update the lot with reduced shares
          const newShareCount = lot.shareCount - remainingToRemove;
          
          const response = await updateInvestment({
            investmentId: lot.$id,
            userId,
            data: {
              shareCount: newShareCount,
            },
          });

          if (response?.error) {
            alert(response.error);
            return;
          }

          remainingToRemove = 0;
        }
      }

      router.refresh();
      onClose();
      setRemoveAmount('');
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            Sell Shares - {holding.symbol}
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            Specify how many shares or what dollar amount to sell.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div>
              <p className="text-gray-500">Total Shares</p>
              <p className="font-semibold">{holding.totalShares.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Current Price</p>
              <p className="font-semibold">{formatAmount(holding.currentPrice)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Value</p>
              <p className="font-semibold">{formatAmount(holding.marketValue)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Sell By</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRemoveType('shares')}
                  className={`flex-1 ${
                    removeType === 'shares'
                      ? 'bg-bank-gradient text-white border-none hover:opacity-90'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Number of Shares
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRemoveType('value')}
                  className={`flex-1 ${
                    removeType === 'value'
                      ? 'bg-bank-gradient text-white border-none hover:opacity-90'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  Dollar Value
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="removeAmount" className="text-sm font-medium">
                {removeType === 'shares' ? 'Number of Shares' : 'Dollar Amount'}
              </Label>
              <Input
                id="removeAmount"
                type="number"
                step={removeType === 'shares' ? '1' : '0.01'}
                min="0"
                max={removeType === 'shares' ? holding.totalShares : holding.marketValue}
                value={removeAmount}
                onChange={(e) => setRemoveAmount(e.target.value)}
                placeholder={removeType === 'shares' ? 'Enter number of shares' : 'Enter dollar amount'}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {removeType === 'shares' 
                  ? `Available: ${holding.totalShares.toFixed(2)} shares`
                  : `Available: ${formatAmount(holding.marketValue)}`
                }
              </p>
            </div>

            {removeAmount && !isNaN(parseFloat(removeAmount)) && parseFloat(removeAmount) > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p className="font-medium text-blue-900">Preview</p>
                <p className="text-blue-700">
                  {removeType === 'shares' 
                    ? `Selling ${removeAmount} shares ≈ ${formatAmount(parseFloat(removeAmount) * holding.currentPrice)}`
                    : `Selling ${formatAmount(parseFloat(removeAmount))} ≈ ${(parseFloat(removeAmount) / holding.currentPrice).toFixed(2)} shares`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleRemove} 
            disabled={isPending || !removeAmount || parseFloat(removeAmount) <= 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? 'Selling...' : 'Sell'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveSharesDialog;

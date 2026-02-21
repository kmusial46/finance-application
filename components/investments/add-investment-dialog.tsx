'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createInvestment } from '@/lib/actions/investment.actions';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, TrendingUp } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

const formSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  shareCount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Must be a positive number',
  }),
  pricePerShare: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Must be a non-negative number',
  }),
  purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
});

interface AddInvestmentDialogProps {
  userId: string;
}

const AddInvestmentDialog = ({ userId }: AddInvestmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [symbolSearch, setSymbolSearch] = useState('');
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockWithWatchlistStatus | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: '',
      shareCount: '',
      pricePerShare: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });
const debouncedFetchStocks = useDebounce(async () => {
    if (!symbolSearch.trim()) {
      setStocks([]);
      return;
    }
    
    setLoadingStocks(true);
    try {
      const results = await searchStocks(symbolSearch.trim());
      setStocks(results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Error searching stocks:', err);
      setStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  }, 300);

  useEffect(() => {
    debouncedFetchStocks();
  }, [symbolSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    startTransition(async () => {
      const response = await createInvestment({
        userId,
        symbol: values.symbol,
        shareCount: Number(values.shareCount),
        pricePerShare: Number(values.pricePerShare),
        purchaseDate: new Date(values.purchaseDate),
      });

      if (response?.error) {
        setError(response.error);
      } else {
        setOpen(false);
        form.reset();
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="form-btn px-6 py-2 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Add Investment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Symbol / Name</FormLabel>
                  <div className="relative" ref={searchRef}>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Search stocks (e.g., AAPL or Apple)..."
                          value={symbolSearch}
                          onChange={(e) => {
                            setSymbolSearch(e.target.value);
                            setShowResults(true);
                          }}
                          onFocus={() => symbolSearch && setShowResults(true)}
                          className="bg-white pr-10"
                        />
                        {loadingStocks && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                    </FormControl>
                    
                    {showResults && stocks.length > 0 && (
                      <div className="absolute left-0 z-50 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white shadow-lg border border-gray-200">
                        <ul>
                          {stocks.map((stock, index) => (
                            <li key={`${stock.symbol}-${index}`}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setSymbolSearch('');
                                  form.setValue('symbol', stock.symbol);
                                  setShowResults(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                              >
                                <TrendingUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {stock.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {stock.symbol} {stock.exchange ? `| ${stock.exchange}` : ''}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedStock && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: <span className="font-semibold">{selectedStock.symbol}</span> - {selectedStock.name}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shareCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shares</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerShare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Basis per Share</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Acquired</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="min-w-0 max-w-full appearance-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full form-btn" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Investment'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvestmentDialog;

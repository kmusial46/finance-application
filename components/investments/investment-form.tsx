'use client';

import { useState, useTransition } from 'react';
import { SubmitHandler, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createInvestment } from '@/lib/actions/investment.actions';
import { searchStocks, getQuote } from '@/lib/actions/finnhub.actions';
import { investmentFormSchema } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

interface InvestmentFormProps {
  userId: string;
}

const InvestmentForm = ({ userId }: InvestmentFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const [suggestions, setSuggestions] = useState<StockWithWatchlistStatus[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema) as Resolver<InvestmentFormValues>,
    defaultValues: {
      query: '',
      shareCount: '',
    },
  });

  const queryValue = form.watch('query');

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!queryValue || queryValue.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await searchStocks(queryValue);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [queryValue]);

  const onSubmit: SubmitHandler<InvestmentFormValues> = (values) => {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      const shares = Number(values.shareCount);

      if (!Number.isFinite(shares) || shares <= 0) {
        setServerError('Enter a valid share count greater than 0.');
        return;
      }

      const quote = await getQuote(values.query);
      if (!quote) {
        setServerError('Invalid symbol or unable to fetch price.');
        return;
      }

      const response = await createInvestment({
        userId,
        symbol: values.query,
        shareCount: shares,
        pricePerShare: quote.price,
        purchaseDate: new Date(),
      });

      if (response?.error) {
        const message = typeof response.error === 'string' ? response.error : 'Unable to save investment.';
        setServerError(message);
        return;
      }

      if (response?.$id) {
        setServerSuccess('Investment added.');
        form.reset();
        router.refresh();
        return;
      }

      setServerError('Unable to save investment. Please try again.');
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-18 font-semibold text-gray-900">Add New Holding</h2>
        <p className="text-14 text-gray-600">Enter a ticker symbol or company name along with your share count. We'll fetch the latest price automatically.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 relative">
                  <FormLabel>Ticker or Company Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="AAPL or Apple Inc." 
                        {...field} 
                        autoComplete="off"
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onFocus={() => {
                          if (queryValue && queryValue.length >= 2) setShowSuggestions(true);
                        }}
                      />
                      {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                        <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                          {isLoadingSuggestions ? (
                            <div className="p-2 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                            </div>
                          ) : (
                            suggestions.map((stock) => (
                              <div
                                key={stock.symbol}
                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                                onClick={() => {
                                  form.setValue('query', stock.symbol);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="font-medium">{stock.symbol}</span>
                                <span className="text-gray-500 truncate max-w-[200px]">{stock.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shareCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Share Count</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {serverError && <p className="text-14 text-red-500">{serverError}</p>}
          {serverSuccess && <p className="text-14 text-green-600">{serverSuccess}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving...' : 'Add Investment'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default InvestmentForm;

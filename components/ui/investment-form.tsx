'use client';

import { useState, useTransition } from 'react';
import { SubmitHandler, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createInvestment } from '@/lib/actions/investment.actions';
import { investmentFormSchema } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

interface InvestmentFormProps {
  userId: string;
}

const InvestmentForm = ({ userId }: InvestmentFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema) as Resolver<InvestmentFormValues>,
    defaultValues: {
      query: '',
      shareCount: '',
    },
  });

  const onSubmit: SubmitHandler<InvestmentFormValues> = (values) => {
    setServerError(null);
    setServerSuccess(null);

    startTransition(async () => {
      const shares = Number(values.shareCount);

      if (!Number.isFinite(shares) || shares <= 0) {
        setServerError('Enter a valid share count greater than 0.');
        return;
      }

      const response = await createInvestment({
        userId,
        input: values.query,
        shareCount: shares,
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
                <FormItem className="sm:col-span-2">
                  <FormLabel>Ticker or Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="AAPL or Apple Inc." {...field} />
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

"use client"

import React from 'react';
import { formatAmount, cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillsMetricsProps {
  bills: Bill[];
}

const BillsMetrics = ({ bills }: BillsMetricsProps) => {
  const metrics = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalDue = 0;
    let paid = 0;
    let remaining = 0;

    bills.forEach(bill => {
      if (bill.status !== 'active') return;

      // Assume monthly for simplicity of "Total Due This Month"
      // If frequency is different, we might need more complex logic, 
      // but for a "Monthly Snapshot", summing active bills is a good baseline.
      totalDue += bill.amount;

      const nextDate = new Date(bill.nextPaymentDate);
      
      // Logic:
      // If nextPaymentDate is in the current month, it is NOT paid yet (Remaining).
      // If nextPaymentDate is in the future (next month or later), it WAS paid this month.
      // If nextPaymentDate is in the past (previous month), it is Overdue (which technically counts as Remaining for this month's view).
      
      const isNextDateInCurrentMonth = nextDate.getMonth() === currentMonth && nextDate.getFullYear() === currentYear;
      const isNextDateInPast = nextDate < now && (nextDate.getMonth() !== currentMonth || nextDate.getFullYear() !== currentYear); // Overdue from previous months?
      
      // Actually, simpler:
      // If nextPaymentDate > EndOfCurrentMonth, it's Paid.
      // If nextPaymentDate <= EndOfCurrentMonth, it's Remaining.
      
      const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
      
      if (nextDate > endOfCurrentMonth) {
        paid += bill.amount;
      } else {
        remaining += bill.amount;
      }
    });

    // Adjust Total to match Paid + Remaining (in case logic drifted)
    // Or keep Total as "Expected" and Paid/Remaining as status.
    // Let's sync them: Total = Paid + Remaining.
    // This handles the case where a bill might be paid early (next date pushed) or late.
    totalDue = paid + remaining;

    const progress = totalDue > 0 ? (paid / totalDue) * 100 : 0;

    return { totalDue, paid, remaining, progress };
  }, [bills]);

  return (
    <Card className="bg-white shadow-sm border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">This Month's Bills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <div className="text-3xl font-bold text-gray-900">
              {formatAmount(metrics.totalDue)}
              <span className="text-sm font-normal text-gray-500 ml-2">due</span>
            </div>
            <div className="text-sm font-medium text-green-600">
              {metrics.progress.toFixed(0)}% Paid
            </div>
          </div>

          <Progress value={metrics.progress} className="h-2 bg-gray-100" indicatorClassName="bg-green-500" />

          <div className="flex justify-between text-sm text-gray-600 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Paid: <span className="font-semibold text-gray-900">{formatAmount(metrics.paid)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span>Remaining: <span className="font-semibold text-gray-900">{formatAmount(metrics.remaining)}</span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillsMetrics;

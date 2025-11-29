"use client"

import React from 'react';
import { AlertCircle, Calendar, TrendingUp, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount, cn } from '@/lib/utils';

interface BillsAlertsProps {
  bills: Bill[];
}

const BillsAlerts = ({ bills }: BillsAlertsProps) => {
  const alerts = React.useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const items: { type: 'overdue' | 'upcoming' | 'new'; bill: Bill; date: Date }[] = [];

    bills.forEach((bill) => {
      if (bill.status !== 'active') return;

      const nextDate = new Date(bill.nextPaymentDate);
      const createdDate = new Date(bill.$createdAt);

      if (nextDate < now && nextDate.getDate() !== now.getDate()) {
        items.push({ type: 'overdue', bill, date: nextDate });
      } else if (nextDate >= now && nextDate <= threeDaysFromNow) {
        items.push({ type: 'upcoming', bill, date: nextDate });
      }

      if (createdDate >= sevenDaysAgo) {
        items.push({ type: 'new', bill, date: createdDate });
      }
    });

    // Sort by severity and date: overdue first (oldest), then upcoming (soonest), then new (newest)
    items.sort((a, b) => {
      const priority = { overdue: 0, upcoming: 1, new: 2 } as Record<string, number>;
      if (priority[a.type] !== priority[b.type]) return priority[a.type] - priority[b.type];
      return a.date.getTime() - b.date.getTime();
    });

    return items;
  }, [bills]);

  const maxItems = 15;
  if (alerts.length === 0) return null;

  const visible = alerts.slice(0, maxItems);
  const remaining = Math.max(0, alerts.length - visible.length);

  return (
    <Card className="bg-white shadow-sm border-none h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">Alerts & Notices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.map(({ type, bill }) => {
          if (type === 'overdue') {
            return (
              <div key={`overdue-${bill.$id}`} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Overdue: {bill.name}</p>
                  <p className="text-xs text-red-700">Due on {new Date(bill.nextPaymentDate).toLocaleDateString()} · {formatAmount(bill.amount)}</p>
                </div>
              </div>
            );
          }

          if (type === 'upcoming') {
            return (
              <div key={`upcoming-${bill.$id}`} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Due Soon: {bill.name}</p>
                  <p className="text-xs text-amber-700">Due {new Date(bill.nextPaymentDate).toLocaleDateString()} · {formatAmount(bill.amount)}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={`new-${bill.$id}`} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <PlusCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">New Bill Detected</p>
                <p className="text-xs text-blue-700">{bill.name} · {formatAmount(bill.amount)}</p>
              </div>
            </div>
          );
        })}

        {remaining > 0 && (
          <div className="text-center text-sm text-gray-500 py-2">+{remaining} more</div>
        )}
      </CardContent>
    </Card>
  );
};

export default BillsAlerts;

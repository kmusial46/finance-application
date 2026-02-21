"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingDown, Calendar, DollarSign, Percent } from 'lucide-react';

interface DebtSummaryProps {
  debts: Debt[];
}

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const DebtSummary = ({ debts }: DebtSummaryProps) => {
  const metrics = React.useMemo(() => {
    const totalInitial = debts.reduce((sum, d) => sum + d.initialAmount, 0);
    const paidAmount = debts.reduce((sum, d) => sum + d.totalAmountPaid, 0);
    const totalDebt = Math.max(0, totalInitial - paidAmount);
    const nextPayment = debts.reduce((sum, d) => sum + (d.minimumPayment || 0), 0);
    
    // Progress
    const progress = totalInitial > 0 ? (paidAmount / totalInitial) * 100 : 0;

    // Group by type for Pie Chart
    const byType: Record<string, number> = {};
    debts.forEach(d => {
      const type = d.type.replace('_', ' ');
      const currentBalance = Math.max(0, d.initialAmount - d.totalAmountPaid);
      byType[type] = (byType[type] || 0) + currentBalance;
    });
    const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    // Projected Trend Data: next 6 months (future projection)
    // Use the aggregated `nextPayment` (sum of minimum payments) as the assumed monthly payment.
    // If `nextPayment` is zero, fall back to an even-split projection (totalDebt / 6).
    const monthlyPayment = nextPayment > 0 ? nextPayment : Math.max(1, Math.round(totalDebt / 6));
    let balance = totalDebt;
    const trendData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + (i + 1)); // i=0 -> next month
      // Subtract payment and floor at 0
      balance = Math.max(0, Math.round(balance - monthlyPayment));
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        amount: balance
      };
    });

    return { totalDebt, nextPayment, progress, pieData, trendData };
  }, [debts]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm border-none bg-blue-50">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div>
              <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Total Debt
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatAmount(metrics.totalDebt)}</p>
            </div>
            <div className="mt-3">
               <Progress value={metrics.progress} className="h-1.5 bg-blue-200" indicatorClassName="bg-blue-600" />
               <p className="text-xs text-blue-600 mt-1 text-right">{metrics.progress.toFixed(0)}% Paid</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-green-50">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div>
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Next Payments
              </p>
              <p className="text-2xl font-bold text-green-900 mt-1">{formatAmount(metrics.nextPayment)}</p>
            </div>
            <p className="text-xs text-green-700 mt-2">Estimated monthly min.</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">Debt Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatAmount(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">Payoff Projection (Est.)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <RechartsTooltip 
                    formatter={(value: number) => formatAmount(value)}
                    cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="amount" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebtSummary;

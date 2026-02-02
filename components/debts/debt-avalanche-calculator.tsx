"use client"

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatAmount } from '@/lib/utils';
import { AlertCircle, TrendingDown, Calculator, DollarSign } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface DebtAvalancheCalculatorProps {
  debts: Debt[];
}

interface PayoffEntry {
  month: number;
  debtName: string;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

interface PayoffResult {
  schedule: PayoffEntry[];
  totalInterest: number;
  totalMonths: number;
  totalPaid: number;
}

interface DebtForCalculation {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

const DebtAvalancheCalculator = ({ debts }: DebtAvalancheCalculatorProps) => {
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  // Prepare debts for calculation
  const calculableDebts: DebtForCalculation[] = useMemo(() => {
    return debts
      .filter(debt => {
        const balance = (debt.initialAmount || 0) - debt.totalAmountPaid;
        return balance > 0 && debt.interestRate !== undefined && debt.minimumPayment !== undefined;
      })
      .map(debt => ({
        id: debt.$id,
        name: debt.name,
        balance: (debt.initialAmount || 0) - debt.totalAmountPaid,
        interestRate: debt.interestRate || 0,
        minimumPayment: debt.minimumPayment || 0,
      }));
  }, [debts]);

  const totalMinimumPayment = useMemo(() => {
    return calculableDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  }, [calculableDebts]);

  const budgetError = useMemo(() => {
    const budget = parseFloat(monthlyBudget);
    if (isNaN(budget) || budget <= 0) return null;
    if (budget < totalMinimumPayment) {
      return `Budget must be at least ${formatAmount(totalMinimumPayment)} to cover minimum payments.`;
    }
    return null;
  }, [monthlyBudget, totalMinimumPayment]);

  // Calculate Avalanche (Highest Interest First)
  const avalancheResult = useMemo((): PayoffResult | null => {
    const budget = parseFloat(monthlyBudget);
    if (isNaN(budget) || budget <= 0 || budgetError) return null;

    return calculatePayoff([...calculableDebts].sort((a, b) => b.interestRate - a.interestRate), budget);
  }, [calculableDebts, monthlyBudget, budgetError]);

  // Calculate Snowball (Lowest Balance First)
  const snowballResult = useMemo((): PayoffResult | null => {
    const budget = parseFloat(monthlyBudget);
    if (isNaN(budget) || budget <= 0 || budgetError) return null;

    return calculatePayoff([...calculableDebts].sort((a, b) => a.balance - b.balance), budget);
  }, [calculableDebts, monthlyBudget, budgetError]);

  function calculatePayoff(orderedDebts: DebtForCalculation[], budget: number): PayoffResult {
    const schedule: PayoffEntry[] = [];
    let totalInterest = 0;
    let month = 0;
    const maxMonths = 600; // 50 years safety limit

    // Clone debts to track balances
    const debtBalances = orderedDebts.map(d => ({ ...d, currentBalance: d.balance }));

    while (debtBalances.some(d => d.currentBalance > 0.01) && month < maxMonths) {
      month++;
      let remainingBudget = budget;

      // First, pay minimum on all debts
      for (const debt of debtBalances) {
        if (debt.currentBalance <= 0) continue;

        const minPayment = Math.min(debt.minimumPayment, debt.currentBalance);
        const monthlyInterest = (debt.currentBalance * debt.interestRate / 100) / 12;
        const principal = Math.max(0, minPayment - monthlyInterest);

        debt.currentBalance -= principal;
        remainingBudget -= minPayment;
        totalInterest += monthlyInterest;

        schedule.push({
          month,
          debtName: debt.name,
          payment: minPayment,
          principalPaid: principal,
          interestPaid: monthlyInterest,
          remainingBalance: Math.max(0, debt.currentBalance),
        });
      }

      // Apply extra payment to highest priority debt with balance
      if (remainingBudget > 0.01) {
        const targetDebt = debtBalances.find(d => d.currentBalance > 0);
        if (targetDebt) {
          const extraPayment = Math.min(remainingBudget, targetDebt.currentBalance);
          const monthlyInterest = (targetDebt.currentBalance * targetDebt.interestRate / 100) / 12;
          
          // Extra payment goes entirely to principal (no additional interest)
          targetDebt.currentBalance -= extraPayment;
          
          // Update the schedule entry for this debt in this month
          const lastEntry = schedule.filter(e => e.month === month && e.debtName === targetDebt.name).pop();
          if (lastEntry) {
            lastEntry.payment += extraPayment;
            lastEntry.principalPaid += extraPayment;
            lastEntry.remainingBalance = Math.max(0, targetDebt.currentBalance);
          }
        }
      }
    }

    const totalPaid = schedule.reduce((sum, entry) => sum + entry.payment, 0);

    return {
      schedule,
      totalInterest,
      totalMonths: month,
      totalPaid,
    };
  }

  const handleCalculate = () => {
    if (!budgetError && parseFloat(monthlyBudget) > 0) {
      setShowResults(true);
    }
  };

  const interestSavings = useMemo(() => {
    if (!avalancheResult || !snowballResult) return 0;
    return snowballResult.totalInterest - avalancheResult.totalInterest;
  }, [avalancheResult, snowballResult]);

  const timeSavings = useMemo(() => {
    if (!avalancheResult || !snowballResult) return 0;
    return snowballResult.totalMonths - avalancheResult.totalMonths;
  }, [avalancheResult, snowballResult]);

  if (calculableDebts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Debt Avalanche Calculator
          </CardTitle>
          <CardDescription>
            Add debts with interest rates and minimum payments to use the calculator.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Debt Avalanche Calculator
        </CardTitle>
        <CardDescription>
          Compare debt payoff strategies and minimise interest paid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="monthly-budget">Monthly Available Budget</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="monthly-budget"
                type="number"
                placeholder="Enter amount"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="pl-9"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum required: {formatAmount(totalMinimumPayment)}
            </p>
          </div>

          {budgetError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{budgetError}</p>
            </div>
          )}

          <Button 
            onClick={handleCalculate} 
            disabled={!!budgetError || !monthlyBudget}
            className="w-full"
          >
            Calculate Payoff Strategies
          </Button>
        </div>

        {/* Results Section */}
        {showResults && avalancheResult && snowballResult && (
          <div className="space-y-6 pt-6 border-t">
            {/* Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Avalanche Method */}
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-green-600" />
                    Avalanche Method
                  </CardTitle>
                  <p className="text-xs text-gray-600">Highest interest rate first</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Total Interest Paid</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatAmount(avalancheResult.totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Payoff Time</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {avalancheResult.totalMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Paid</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatAmount(avalancheResult.totalPaid)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Snowball Method */}
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gray-600" />
                    Snowball Method
                  </CardTitle>
                  <p className="text-xs text-gray-600">Lowest balance first</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Total Interest Paid</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {formatAmount(snowballResult.totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Payoff Time</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {snowballResult.totalMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Paid</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatAmount(snowballResult.totalPaid)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Savings Summary */}
            {interestSavings > 0 && (
              <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Avalanche Savings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Interest Saved</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatAmount(interestSavings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700">Time Saved</p>
                    <p className="text-xl font-bold text-green-900">
                      {timeSavings} months
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payoff Order */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Avalanche Payoff Order</h4>
              <div className="space-y-2">
                {[...calculableDebts]
                  .sort((a, b) => b.interestRate - a.interestRate)
                  .map((debt, idx) => (
                    <div key={debt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{debt.name}</p>
                        <p className="text-xs text-gray-500">
                          {debt.interestRate.toFixed(2)}% APR • {formatAmount(debt.balance)} balance
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Min. Payment</p>
                        <p className="text-sm font-medium">{formatAmount(debt.minimumPayment)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Visual Progress */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Debt-Free Progress Timeline</h4>
              <div className="space-y-4">
                {[...calculableDebts]
                  .sort((a, b) => b.interestRate - a.interestRate)
                  .map(debt => {
                    // Find when this debt is paid off
                    const payoffMonth = avalancheResult.schedule
                      .filter(e => e.debtName === debt.name && e.remainingBalance === 0)
                      .map(e => e.month)[0] || avalancheResult.totalMonths;
                    
                    const progressPercent = (payoffMonth / avalancheResult.totalMonths) * 100;

                    return (
                      <div key={debt.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{debt.name}</span>
                          <span className="text-gray-500">Month {payoffMonth}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebtAvalancheCalculator;

"use client"

import React, { useMemo, useState } from 'react';
import { formatAmount, cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import BillDebtDetails from './bill-debt-details';

const DebtsList = ({ debts }: { debts: Debt[] }) => {
    const [sort, setSort] = useState<string>('balance-desc');

    const sortedDebts = useMemo(() => {
        if (!debts) return [] as Debt[];
        const copy = [...debts];
        switch (sort) {
            case 'name':
                return copy.sort((a, b) => a.name.localeCompare(b.name));
            case 'balance-asc':
                return copy.sort((a, b) => a.totalAmount - b.totalAmount);
            case 'balance-desc':
            default:
                return copy.sort((a, b) => b.totalAmount - a.totalAmount);
        }
    }, [debts, sort]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end">
                <label className="text-sm text-gray-600 mr-2">Sort:</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-2 py-1 text-sm">
                    <option value="balance-desc">Balance (high → low)</option>
                    <option value="balance-asc">Balance (low → high)</option>
                    <option value="name">Name (A → Z)</option>
                </select>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {sortedDebts.map((debt) => {
                                const progress = debt.initialAmount 
                                        ? ((debt.initialAmount - debt.totalAmount) / debt.initialAmount) * 100 
                                        : 0;

                                // Payoff estimate
                                const balance = Number(debt.totalAmount || 0);
                                const payment = Number(debt.minimumPayment || (balance / 12)); // default to 12-month payoff
                                const annualRate = Number(debt.interestRate || 0);
                                const monthlyRate = annualRate / 100 / 12;

                                let estMonths: number | null = null;
                                let estPayoffDate: string | null = null;

                                if (balance <= 0) {
                                    estMonths = 0;
                                } else if (monthlyRate > 0) {
                                    // If payment doesn't cover monthly interest, can't amortize
                                    if (payment <= balance * monthlyRate) {
                                        estMonths = null; // indicate unpayable with current payment
                                    } else {
                                        const n = -Math.log(1 - (monthlyRate * balance) / payment) / Math.log(1 + monthlyRate);
                                        estMonths = Math.ceil(n || 0);
                                    }
                                } else {
                                    estMonths = Math.ceil(balance / payment);
                                }

                                if (estMonths !== null && estMonths !== undefined) {
                                    const d = new Date();
                                    d.setMonth(d.getMonth() + estMonths);
                                    estPayoffDate = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                                }

                                return (
                    <Dialog key={debt.$id}>
                        <DialogTrigger asChild>
                            <div className="rounded-xl border bg-white p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{debt.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{debt.type.replace('_', ' ')}</p>
                                    </div>
                                    {/* clickable card; no separate details label */}
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500">Remaining Balance</span>
                                            <span className="font-semibold text-gray-900">{formatAmount(debt.totalAmount)}</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>{progress.toFixed(0)}% Paid off</span>
                                            {debt.initialAmount && <span>Total: {formatAmount(debt.initialAmount)}</span>}
                                        </div>
                                    </div>

                                                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div>
                                            <p className="text-xs text-gray-500">Interest Rate</p>
                                            <p className="font-medium text-gray-900">{debt.interestRate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Min Payment</p>
                                            <p className="font-medium text-gray-900">{debt.minimumPayment ? formatAmount(debt.minimumPayment) : 'N/A'}</p>
                                        </div>
                                    </div>
                                                                        <div className="pt-3 text-sm text-gray-600">
                                                                            {estMonths === null ? (
                                                                                <p className="text-xs text-red-600">Current payment too low to amortize — increase payment</p>
                                                                            ) : (
                                                                                <p>Est. payoff: <span className="font-medium text-gray-900">{estMonths} month{estMonths > 1 ? 's' : ''}</span> {estPayoffDate && <span className="text-xs text-gray-500">(by {estPayoffDate})</span>}</p>
                                                                            )}
                                                                        </div>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-white">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{debt.name}</DialogTitle>
                            </DialogHeader>
                            <BillDebtDetails item={debt} type="debt" />
                        </DialogContent>
                    </Dialog>
                );
            })}
        </div>
    </div>
  );
};

export default DebtsList;

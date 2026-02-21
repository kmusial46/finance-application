"use client"

import { useMemo, useState, type MouseEvent } from 'react';
import { formatAmount, cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import DebtDetails from './debt-details';
import { deleteDebt } from '@/lib/actions/bills-debts.actions';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

const DebtsList = ({ debts }: { debts: Debt[] }) => {
    const [sort, setSort] = useState<string>('balance-desc');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    const sortedDebts = useMemo(() => {
        if (!debts) return [] as Debt[];
        const copy = [...debts];
        switch (sort) {
            case 'name':
                return copy.sort((a, b) => a.name.localeCompare(b.name));
            case 'balance-asc':
                return copy.sort((a, b) => (a.initialAmount - a.totalAmountPaid) - (b.initialAmount - b.totalAmountPaid));
            case 'balance-desc':
            default:
                return copy.sort((a, b) => (b.initialAmount - b.totalAmountPaid) - (a.initialAmount - a.totalAmountPaid));
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
                                // Payoff estimate
                                const balance = Math.max(0, debt.initialAmount - debt.totalAmountPaid);
                        const isPaidOff = balance <= 0;

                        const progress = debt.initialAmount
                            ? Math.min(100, Math.max(0, (debt.totalAmountPaid / debt.initialAmount) * 100))
                            : 0;

                                const payment = Number(debt.minimumPayment || (balance / 12)); // default to 12-month payoff
                                const annualRate = Number(debt.interestRate || 0);
                                const monthlyRate = annualRate / 100 / 12;

                                let estMonths: number | null = null;
                                let estPayoffDate: string | null = null;

                                if (balance <= 0) {
                                    estMonths = 0;
                                } else if (monthlyRate > 0) {
                                    // If payment doesn't cover monthly interest, can't amortise
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

                                const handleDelete = async (e: MouseEvent<HTMLButtonElement>) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    setDeletingId(debt.$id);
                                    try {
                                        await deleteDebt(debt.$id);
                                        router.refresh();
                                    } catch (error) {
                                        console.error(error);
                                    } finally {
                                        setDeletingId(null);
                                    }
                                };

                                return (
                    <Dialog key={debt.$id}>
                        <DialogTrigger asChild>
                            <div
                                className={cn(
                                    "rounded-xl border p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow",
                                    isPaidOff ? "border-green-200 bg-green-50" : "bg-white"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{debt.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{debt.type.replace('_', ' ')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isPaidOff ? (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                Paid off
                                            </span>
                                        ) : null}
                                        {isPaidOff ? (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleDelete}
                                                disabled={deletingId === debt.$id}
                                                className="h-8 bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
                                            >
                                                {deletingId === debt.$id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500">Remaining Balance</span>
                                            <span className="font-semibold text-gray-900">{formatAmount(balance)}</span>
                                        </div>
                                        <Progress
                                            value={isPaidOff ? 100 : progress}
                                            className={cn("h-2", isPaidOff ? "bg-green-100" : undefined)}
                                            indicatorClassName={isPaidOff ? "bg-green-600" : undefined}
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>{isPaidOff ? "Paid off completely" : `${progress.toFixed(0)}% Paid off`}</span>
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
                                                                        {!isPaidOff ? (
                                                                            <div className="pt-3 text-sm text-gray-600">
                                                                                {estMonths === null ? (
                                                                                    <p className="text-xs text-red-600">Current payment too low to amortize — increase payment</p>
                                                                                ) : (
                                                                                    <p>Est. payoff: <span className="font-medium text-gray-900">{estMonths} month{estMonths > 1 ? 's' : ''}</span> {estPayoffDate && <span className="text-xs text-gray-500">(by {estPayoffDate})</span>}</p>
                                                                                )}
                                                                            </div>
                                                                        ) : null}
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-white">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{debt.name}</DialogTitle>
                            </DialogHeader>
                            <DebtDetails debt={debt} />
                        </DialogContent>
                    </Dialog>
                );
            })}
        </div>
    </div>
  );
};

export default DebtsList;

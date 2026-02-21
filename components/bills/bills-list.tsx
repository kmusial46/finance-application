"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { formatAmount, cn } from '@/lib/utils';
import { markBillAsPaid } from '@/lib/actions/bills-debts.actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import BillDetails from './bill-details';

const BillsList = ({ bills }: { bills: Bill[] }) => {
    const [sort, setSort] = useState<string>('nextPayment');
    const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [bills?.length]);

    const sortedBills = useMemo(() => {
        if (!bills) return [] as Bill[];
        const copy = [...bills];
        switch (sort) {
            case 'name':
                return copy.sort((a, b) => a.name.localeCompare(b.name));
            case 'amount-desc':
                return copy.sort((a, b) => b.amount - a.amount);
            case 'amount-asc':
                return copy.sort((a, b) => a.amount - b.amount);
            case 'nextPayment':
            default:
                return copy.sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime());
        }
    }, [bills, sort]);

    const handleMarkPaid = async (bill: Bill) => {
        if (!bill?.$id) return;

        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

        setMarkingPaidId(bill.$id);
        try {
            await markBillAsPaid(bill.$id, bill.nextPaymentDate, bill.frequency);
            toast.success(`Marked ${bill.name} as paid.`);

            // Avoid scroll jumps when the list re-sorts after refresh.
            try {
                (document.activeElement as HTMLElement | null)?.blur?.();
            } catch {
                // noop
            }

            router.refresh();

            // Restore the user's scroll position after the refresh commits.
            if (typeof window !== 'undefined') {
                requestAnimationFrame(() => {
                    window.scrollTo({ top: scrollY, behavior: 'auto' });
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to mark bill as paid.');
        } finally {
            setMarkingPaidId(null);
        }
    };

    const renderPaidCheckbox = (bill: Bill) => {
        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const isPaidThisMonth = new Date(bill.nextPaymentDate) > endOfCurrentMonth;
        const isMarking = markingPaidId === bill.$id;

        return (
            <div className="flex items-center justify-center">
                <label
                    className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-md',
                        !(isPaidThisMonth || isMarking) && 'hover:bg-gray-50',
                        (isPaidThisMonth || isMarking) && 'opacity-60'
                    )}
                >
                    <input
                        type="checkbox"
                        aria-label={`Mark ${bill.name} as paid`}
                        checked={isPaidThisMonth}
                        disabled={isPaidThisMonth || isMarking}
                        onChange={() => handleMarkPaid(bill)}
                        className="sr-only peer"
                    />

                    <span
                        aria-hidden="true"
                        className={cn(
                            'inline-flex h-4 w-4 items-center justify-center rounded-md border border-gray-400 bg-white transition-colors',
                            'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2',
                            'peer-checked:border-blue-600 peer-checked:bg-blue-600',
                            'peer-disabled:cursor-not-allowed'
                        )}
                    >
                        <Check className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                    </span>
                </label>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4">
        <div className="rounded-md border bg-white overflow-hidden">
                    <div className="flex items-center justify-end p-4 border-b">
                        <label className="text-sm text-gray-600 mr-2">Sort:</label>
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-2 py-1 text-sm">
                            <option value="nextPayment">Next payment (soonest)</option>
                            <option value="name">Name (A → Z)</option>
                            <option value="amount-desc">Amount (high → low)</option>
                            <option value="amount-asc">Amount (low → high)</option>
                        </select>
                    </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3 hidden md:table-cell">Frequency</th>
                        <th className="px-6 py-3 text-center md:hidden">Paid</th>
                        <th className="px-6 py-3">Next Payment</th>
                        <th className="px-6 py-3 hidden md:table-cell">Paid</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                                        {(() => {
                                            const start = (currentPage - 1) * pageSize;
                                            const end = Math.min(start + pageSize, sortedBills.length);
                                            const paged = sortedBills.slice(start, end);
                                            return paged.map((bill) => (
                        <tr key={bill.$id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{bill.name}</td>
                            <td className="px-6 py-4">{formatAmount(bill.amount)}</td>
                            <td className="px-6 py-4 hidden md:table-cell capitalize">{bill.frequency}</td>
                            <td className="px-6 py-4 md:hidden">
                                {renderPaidCheckbox(bill)}
                            </td>
                            <td className="px-6 py-4">{new Date(bill.nextPaymentDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 hidden md:table-cell">
                                {renderPaidCheckbox(bill)}
                            </td>
                            <td className="px-6 py-4">
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", 
                                    bill.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                                    {bill.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="text-blue-600 hover:underline font-medium">
                                            Details
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px] bg-white">
                                                    <DialogHeader className="sr-only">
                                                        <DialogTitle>{bill.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <BillDetails bill={bill} />
                                                </DialogContent>
                                </Dialog>
                            </td>
                        </tr>
                                            ));
                                        })()}
                </tbody>
            </table>
                        {/* Pagination controls */}
                        <div className="flex items-center justify-between p-4 border-t">
                            <div className="text-sm text-gray-600">{(() => {
                                const start = (currentPage - 1) * pageSize;
                                const end = Math.min(start + pageSize, sortedBills.length);
                                if (sortedBills.length === 0) return 'No bills';
                                return `Showing ${start + 1}-${end} of ${sortedBills.length}`;
                            })()}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.max(1, Math.ceil(sortedBills.length / pageSize)) }).map((_, i) => {
                                        const page = i + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={cn('px-2 py-1 rounded text-sm', currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border')}
                                            >
                                                {page}
                                            </button>
                                        )
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(sortedBills.length / pageSize), p + 1))}
                                    disabled={currentPage >= Math.ceil(sortedBills.length / pageSize)}
                                    className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
        </div>
    </div>
  );
};

export default BillsList;

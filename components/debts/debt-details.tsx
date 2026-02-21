"use client"

import React, { useState } from 'react'
import { formatAmount } from '@/lib/utils'
import { Progress } from "@/components/ui/progress"
import { EditDebtDialog } from './edit-debt-dialog'
import { Button } from '../ui/button'
import { DialogClose } from '../ui/dialog'
import { deleteDebt, syncDebtWithPlaid } from '@/lib/actions/bills-debts.actions'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { PaymentDialog } from '@/components/bills/payment-dialog'
import { useRouter } from 'next/navigation'

interface DebtDetailsProps {
  debt: Debt
}

const DebtDetails = ({ debt }: DebtDetailsProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()

  const getPayoffEstimate = (debt: Debt) => {
    const balance = Math.max(0, debt.initialAmount - debt.totalAmountPaid);
    const payment = Number(debt.minimumPayment || Math.max(1, balance / 12)); // avoid divide by zero
    const annualRate = Number(debt.interestRate || 0);
    const monthlyRate = annualRate / 100 / 12;

    let estMonths: number | null = null;
    if (balance <= 0) {
      estMonths = 0;
    } else if (monthlyRate > 0) {
      if (payment <= balance * monthlyRate) {
        estMonths = null;
      } else {
        const n = -Math.log(1 - (monthlyRate * balance) / payment) / Math.log(1 + monthlyRate);
        estMonths = Math.ceil(n || 0);
      }
    } else {
      estMonths = Math.ceil(balance / payment);
    }

    let estPayoffDate: string | null = null;
    if (estMonths !== null) {
      const d = new Date();
      d.setMonth(d.getMonth() + estMonths);
      estPayoffDate = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }

    return { payment, estMonths, estPayoffDate };
  }

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this debt?")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteDebt(debt.$id)
      router.refresh()
      // Close dialog by finding the close button
      document.getElementById('close-dialog-btn')?.click()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSync = async () => {
    if (!debt.linkedAccountId) return
    
    setIsSyncing(true)
    try {
      await syncDebtWithPlaid(debt.$id, debt.linkedAccountId)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{debt.name}</h2>
          <p className="text-sm text-gray-500 capitalize">
            {debt.type.replace('_', ' ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {formatAmount(Math.max(0, debt.initialAmount - debt.totalAmountPaid))}
          </p>
          <p className="text-xs text-gray-500">Remaining Balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Payment Information</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">
                {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Interest Rate</p>
              <p className="font-medium">{debt.interestRate}%</p>
            </div>
            <div>
              <p className="text-gray-500">Min Payment</p>
              <p className="font-medium">{formatAmount(debt.minimumPayment || 0)}</p>
            </div>
          </div>

          {debt.initialAmount && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Payoff Progress</span>
                <span>
                  {Math.round((debt.totalAmountPaid / debt.initialAmount) * 100)}%
                </span>
              </div>
              <Progress value={(debt.totalAmountPaid / debt.initialAmount) * 100} />
            </div>
          )}

          {/* Payoff estimate */}
          {(() => {
            const { payment, estMonths, estPayoffDate } = getPayoffEstimate(debt);
            return (
              <div className="pt-3 text-sm text-gray-700">
                <p>Assuming <span className="font-medium">{formatAmount(payment)}</span> per month:</p>
                {estMonths === null ? (
                  <p className="text-xs text-red-600">Current payment is too low to amortize this debt — increase monthly payment.</p>
                ) : (
                  <p className="text-xs">Estimated payoff in <span className="font-medium">{estMonths} month{estMonths > 1 ? 's' : ''}</span>{estPayoffDate ? <> (by {estPayoffDate})</> : null}</p>
                )}
              </div>
            )
          })()}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold">Linked Account</h3>
            {debt.linkedAccountId && debt.linkedAccountId !== 'none' && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className="h-8 text-blue-600"
                >
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Sync Balance
                </Button>
            )}
          </div>
          {debt.linkedAccountId && debt.linkedAccountId !== 'none' ? (
            <div className="p-3 border rounded-lg bg-gray-50 text-sm">
              <p className="font-medium">Linked to Plaid Account</p>
              <p className="text-xs text-gray-500">ID: {debt.linkedAccountId}</p>
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-gray-50 border-dashed text-sm">
              <p className="text-gray-500 text-center">No account linked</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-4 border-t">
        <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
        >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete
        </Button>

        <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" id="close-dialog-btn">Close</Button>
            </DialogClose>
            <EditDebtDialog debt={debt} />
            <PaymentDialog type="debt" data={debt} />
        </div>
      </div>
    </div>
  )
}

export default DebtDetails

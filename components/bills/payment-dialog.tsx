"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { makeDebtPayment, markBillAsPaid } from "@/lib/actions/bills-debts.actions"
import { Loader2, CheckCircle2 } from "lucide-react"
import { formatAmount } from "@/lib/utils"

interface PaymentDialogProps {
  type: 'bill' | 'debt'
  data: any // Bill or Debt object
}

export function PaymentDialog({ type, data }: PaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0,10))

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      if (type === 'debt') {
        const paymentAmount = parseFloat(amount)
        if (isNaN(paymentAmount) || paymentAmount <= 0) return

        // If user is paying more than remaining balance, confirm
        const remainingBalance = Math.max(0, data.initialAmount - data.totalAmountPaid);
        if (paymentAmount > remainingBalance) {
          const confirmed = window.confirm(`You're entering ${formatAmount(paymentAmount)}, which is more than the remaining balance ${formatAmount(remainingBalance)}. Continue?`)
          if (!confirmed) return
        }

        await makeDebtPayment(data.$id, paymentAmount, paymentDate)
      } else {
        // For bills, we just mark as paid and advance the date
        await markBillAsPaid(data.$id, data.nextPaymentDate, data.frequency)
      }
      setOpen(false)
      setAmount("")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 text-white hover:bg-green-700">
          Make Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>
            {type === 'debt' ? 'Make a Payment' : 'Mark as Paid'}
          </DialogTitle>
          <DialogDescription>
            {type === 'debt' 
              ? `Reduce your balance for ${data.name}.` 
              : `Confirm payment for ${data.name}. This will update the due date.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            {type === 'debt' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3"
                  placeholder="0.00"
                />
                <Label htmlFor="paymentDate" className="text-right">
                  Date
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
            ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <p className="text-sm text-gray-500">Current Due Date</p>
                <p className="font-semibold">
                  {new Date(data.nextPaymentDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="font-semibold text-lg">
                  {formatAmount(data.amount)}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={handlePayment} 
            disabled={isLoading || (type === 'debt' && (!amount || parseFloat(amount) <= 0))}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

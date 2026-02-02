"use client"

import React, { useState } from 'react'
import { formatAmount } from '@/lib/utils'
import { EditBillDialog } from './edit-bill-dialog'
import { Button } from '../ui/button'
import { DialogClose } from '../ui/dialog'
import { deleteBill } from '@/lib/actions/bills-debts.actions'
import { Loader2, Trash2 } from 'lucide-react'
import { PaymentDialog } from './payment-dialog'

interface BillDetailsProps {
  bill: Bill
}

const BillDetails = ({ bill }: BillDetailsProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this bill?")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteBill(bill.$id)
      // Close dialog by finding the close button
      document.getElementById('close-dialog-btn')?.click()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{bill.name}</h2>
          <p className="text-sm text-gray-500 capitalize">
            {bill.category}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {formatAmount(bill.amount)}
          </p>
          <p className="text-xs text-gray-500">Amount Due</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Payment Information</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">
                {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Frequency</p>
              <p className="font-medium capitalize">{bill.frequency}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-semibold">Linked Account</h3>
          {bill.linkedAccountId && bill.linkedAccountId !== 'none' ? (
            <div className="p-3 border rounded-lg bg-gray-50 text-sm">
              <p className="font-medium">Linked to Plaid Account</p>
              <p className="text-xs text-gray-500">ID: {bill.linkedAccountId}</p>
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
            <EditBillDialog bill={bill} />
            <PaymentDialog type="bill" data={bill} />
        </div>
      </div>
    </div>
  )
}

export default BillDetails

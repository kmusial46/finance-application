"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { scanRecurringBills } from "@/lib/actions/bills-debts.actions"
import { Loader2, ScanSearch } from "lucide-react"
import { toast } from "sonner"

interface ScanBillsPromptProps {
  userId: string
  billsCount: number
}

export function ScanBillsPrompt({ userId, billsCount }: ScanBillsPromptProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only show if user has no bills and hasn't dismissed it recently
    const hasDismissed = localStorage.getItem("dismissedScanPrompt")
    if (billsCount === 0 && !hasDismissed) {
      setOpen(true)
    }
  }, [billsCount])

  const handleScan = async () => {
    setIsLoading(true)
    try {
      const result = await scanRecurringBills({ userId })
      toast.success(`Scan complete! Found ${result.newBills} new bills and updated ${result.updatedBills}.`)
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to scan for bills. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setOpen(false)
    localStorage.setItem("dismissedScanPrompt", "true")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-blue-600" />
            Scan for Recurring Bills?
          </DialogTitle>
          <DialogDescription>
            We noticed you don't have any bills set up yet. We can scan your linked bank accounts to automatically find subscriptions and recurring payments.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
          <Button onClick={handleScan} disabled={isLoading} className="bg-blue-600 text-white">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              "Scan Now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

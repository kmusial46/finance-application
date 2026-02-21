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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = result

      if (r?.banksScanned === 0) {
        toast.error("No linked bank accounts found. Link a bank first.")
        return
      }

      if (r?.banksFailed && r.banksFailed > 0) {
        const failures = Array.isArray(r.bankFailures) ? r.bankFailures : []
        const codes = failures.map((f: any) => f?.errorCode).filter(Boolean)
        const needsReauth = Number(r.banksNeedingReauth ?? 0)
        const firstFailure = failures[0]
        const firstCode = String(firstFailure?.errorCode ?? 'UNKNOWN_ERROR')
        const firstMsgRaw = String(firstFailure?.errorMessage ?? '')
        const firstMsg = firstMsgRaw.length > 160 ? `${firstMsgRaw.slice(0, 157)}...` : firstMsgRaw

        if (needsReauth > 0) {
          toast.error(
            `Scan completed with issues. ${needsReauth} bank connection(s) need re-authentication. Found ${result.newBills} new bills and updated ${result.updatedBills}.`
          )
          setOpen(false)
          return
        }

        if (codes.includes('INVALID_ACCESS_TOKEN')) {
          toast.error(
            `Scan completed with issues. One or more bank tokens are invalid (often a Plaid environment mismatch). Found ${result.newBills} new bills and updated ${result.updatedBills}.`
          )
          setOpen(false)
          return
        }

        if (codes.includes('PRODUCT_NOT_READY') || codes.includes('PRODUCT_NOT_ENABLED') || codes.includes('PRODUCT_NOT_SUPPORTED')) {
          toast.error(
            `Scan completed with issues. Recurring transactions may not be available for one or more banks yet. Found ${result.newBills} new bills and updated ${result.updatedBills}.`
          )
          setOpen(false)
          return
        }

        toast.error(
          `Scan completed with issues. ${r.banksFailed} bank connection(s) failed during scan (${firstCode}${firstMsg ? `: ${firstMsg}` : ''}). Found ${result.newBills} new bills and updated ${result.updatedBills}.`
        )
        setOpen(false)
        return
      }

      if (result.newBills === 0 && result.updatedBills === 0 && r?.streamsFound === 0) {
        toast.success("No recurring bills detected in your recent activity.")
        setOpen(false)
        return
      }

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

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { scanRecurringBills } from "@/lib/actions/bills-debts.actions"
import { Loader2, ScanSearch } from "lucide-react"
import { toast } from "sonner"

export function ScanBillsButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleScan = async () => {
    setIsLoading(true)
    try {
      const result = await scanRecurringBills({ userId })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = result

      // Provide more actionable feedback when the scan couldn't actually run.
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
          return
        }

        if (codes.includes('INVALID_ACCESS_TOKEN')) {
          toast.error(
            `Scan completed with issues. One or more bank tokens are invalid (often a Plaid environment mismatch). Found ${result.newBills} new bills and updated ${result.updatedBills}.`
          )
          return
        }

        if (codes.includes('PRODUCT_NOT_READY') || codes.includes('PRODUCT_NOT_ENABLED') || codes.includes('PRODUCT_NOT_SUPPORTED')) {
          toast.error(
            `Scan completed with issues. Recurring transactions may not be available for one or more banks yet. Found ${result.newBills} new bills and updated ${result.updatedBills}.`
          )
          return
        }

        toast.error(
          `Scan completed with issues. ${r.banksFailed} bank connection(s) failed during scan (${firstCode}${firstMsg ? `: ${firstMsg}` : ''}). Found ${result.newBills} new bills and updated ${result.updatedBills}.`
        )
        return
      }

      if (result.newBills === 0 && result.updatedBills === 0 && r?.streamsFound === 0) {
        toast.success("No recurring bills detected in your recent activity.")
        return
      }

      toast.success(`Scan complete! Found ${result.newBills} new bills and updated ${result.updatedBills}.`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to scan for bills.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleScan} 
      disabled={isLoading}
      className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
      Scan Bills
    </Button>
  )
}

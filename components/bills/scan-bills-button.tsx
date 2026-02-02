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

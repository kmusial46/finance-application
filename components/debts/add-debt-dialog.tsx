"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDebt, getUserAccounts } from "@/lib/actions/bills-debts.actions"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  currentBalance: z.coerce.number().min(0.01, "Initial amount must be greater than 0"),
  interestRate: z.coerce.number().optional(),
  minimumPayment: z.coerce.number().optional(),
  dueDate: z.string().optional(),
  type: z.enum(["credit_card", "loan", "bnpl", "other"]),
  linkedAccountId: z.string().optional(),
})

export function AddDebtDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    const loadAccounts = async () => {
      if (userId) {
        const data = await getUserAccounts({ userId })
        setAccounts(data)
      }
    }
    loadAccounts()
  }, [userId])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currentBalance: 0,
      type: "credit_card" as "credit_card" | "loan" | "bnpl" | "other",
      linkedAccountId: "none",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // When creating, we assume the current balance is the initial amount and nothing is paid yet
      await createDebt({
        userId,
        name: values.name,
        totalAmountPaid: 0,
        initialAmount: values.currentBalance,
        interestRate: values.interestRate,
        minimumPayment: values.minimumPayment,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
        type: values.type,
        linkedAccountId: values.linkedAccountId === "none" ? undefined : values.linkedAccountId,
      })
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-2">
          + Add Debt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Debt</DialogTitle>
          <DialogDescription>
            Manually track a loan, credit card, or other liability.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Chase Sapphire, Student Loan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="currentBalance"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          value={field.value as number}
                          className={form.formState.errors.currentBalance ? "border-red-500" : ""}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="loan">Loan</SelectItem>
                            <SelectItem value="bnpl">BNPL</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>APR % (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="19.99" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="minimumPayment"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Min Payment (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Next Due Date (Optional)</FormLabel>
                <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Bank Account (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                        <SelectItem value="none">None</SelectItem>
                        {accounts.map((acc: any) => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.name} ({acc.mask})
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white">
                {isLoading ? <Loader2 className="animate-spin" /> : "Save Debt"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

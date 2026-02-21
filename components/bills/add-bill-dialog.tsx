"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { createBill, getUserAccounts } from "@/lib/actions/bills-debts.actions"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  frequency: z.enum(["weekly", "bi-weekly", "monthly", "yearly"]),
  category: z.string().min(2, "Category is required"),
  linkedAccountId: z.string().optional(),
})

export function AddBillDialog({ userId }: { userId: string }) {
  const router = useRouter()
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
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      frequency: "monthly" as "weekly" | "bi-weekly" | "monthly" | "yearly",
      category: "",
      linkedAccountId: "none",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const created = await createBill({
        userId,
        name: values.name,
        amount: values.amount,
        dueDate: new Date(values.dueDate).toISOString(),
        frequency: values.frequency,
        category: values.category,
        isAutoDetected: false,
        status: 'active',
        nextPaymentDate: new Date(values.dueDate).toISOString(),
        linkedAccountId: values.linkedAccountId === "none" ? undefined : values.linkedAccountId,
      })
      setOpen(false)
      form.reset()

      // Ensure the bills list updates immediately after creating a bill.
      router.refresh()

      const createdId = created?.$id ? ` (#${created.$id})` : ""
      toast.success(`Bill added.${createdId}`)
    } catch (error) {
      console.error(error)

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to add bill."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-2">
          + Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
          <DialogDescription>
            Manually add a recurring bill or subscription.
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
                    <Input placeholder="Netflix, Rent, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                    <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                            <SelectItem value="subscription">Subscription</SelectItem>
                            <SelectItem value="utility">Utility</SelectItem>
                            <SelectItem value="rent">Rent / Mortgage</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="phone">Phone / Internet</SelectItem>
                            <SelectItem value="membership">Membership</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                <FormItem className="min-w-0">
                    <FormLabel>Next Due Date</FormLabel>
                    <FormControl>
                <Input type="date" className="w-full max-w-full appearance-none" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                <FormItem className="min-w-0">
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                  <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to Bank Account (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
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
                {isLoading ? <Loader2 className="animate-spin" /> : "Add Bill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

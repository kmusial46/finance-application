"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createGoal } from "@/lib/actions/goal.actions"
import { useState } from "react"
import { Loader2, Wallet, Link as LinkIcon, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Compute today's date string in YYYY-MM-DD to use as the `min` for the date input
const todayISO = new Date().toISOString().slice(0, 10);

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Goal name must be at least 2 characters.",
  }),
  targetAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Target amount must be a positive number.",
  }),
  // Only validate date if provided: it must not be in the past.
  targetDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const selected = new Date(val);
    const today = new Date();
    // zero time components for both dates for fair comparison
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  }, { message: "Target date cannot be in the past." }),
  type: z.enum(["manual", "linked"]),
  linkedAccountId: z.string().optional(),
})

const GoalForm = ({ userId, accounts }: { userId: string, accounts: Account[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      type: "manual",
    },
  })

  const goalType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const linkedAccount = accounts.find(acc => acc.id === values.linkedAccountId);
      
      await createGoal({
        userId,
        name: values.name,
        targetAmount: Number(values.targetAmount),
        targetDate: values.targetDate,
        type: values.type as GoalType,
        linkedAccountId: values.linkedAccountId,
        linkedBankId: linkedAccount?.appwriteItemId,
        status: "active",
        currentAmount: 0 
      });
      
      form.reset();
      setStep(1); // Reset to step 1
      router.refresh();
      // Ideally we would close the dialog here, but we rely on the parent to handle that or the user to click outside/close.
      // Since we are inside a DialogContent, we can't easily close it from here without a prop or context.
      // For now, the refresh will update the list behind the modal.
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTypeSelect = (type: "manual" | "linked") => {
    form.setValue("type", type);
    setStep(2);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* STEP 1: Choose Type */}
        {step === 1 && (
          <div className="flex flex-col gap-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div 
                onClick={() => handleTypeSelect("manual")}
                className="cursor-pointer rounded-xl border-2 border-gray-100 bg-white p-6 transition-all hover:border-bankGradient hover:shadow-md group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-50">
                  <Wallet className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Manual Goal</h3>
                <p className="text-sm text-gray-500">
                  Set a target and update your progress manually as you save.
                </p>
              </div>

              <div 
                onClick={() => handleTypeSelect("linked")}
                className="cursor-pointer rounded-xl border-2 border-gray-100 bg-white p-6 transition-all hover:border-bankGradient hover:shadow-md group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-50">
                  <LinkIcon className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Linked Goal</h3>
                <p className="text-sm text-gray-500">
                  Connect a bank account to automatically track your balance towards a goal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Details Form */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                {goalType} Goal
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New Car, Vacation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="5000" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" min={todayISO} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {goalType === "linked" && (
              <FormField
                control={form.control}
                name="linkedAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Account</FormLabel>
                    <FormControl>
                      <Select onValueChange={(val) => field.onChange(val)} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.mask})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 mt-4">
              <Button type="submit" className="w-full bg-bankGradient text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {isLoading ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}

export default GoalForm

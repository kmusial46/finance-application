import React from 'react'
import HeaderBox from '@/components/ui/header-box'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { getGoals } from '@/lib/actions/goal.actions'
import { getAccounts } from '@/lib/actions/bank.actions'
import GoalsList from '@/components/goals/goals-list'
import GoalForm from '@/components/goals/goal-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from 'lucide-react'

const Savings = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const goals = await getGoals({ userId: loggedIn.$id });
  const accountsData = await getAccounts({ userId: loggedIn.$id });
  const accounts = accountsData?.data || [];

  return (
    <section className="flex w-full flex-col gap-8 bg-gray-50 px-5 py-8 lg:py-12">
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
        <HeaderBox 
          title="Savings & Goals"
          subtext="Manage your savings goals and track your progress."
        />
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex gap-2 bg-bankGradient text-white">
              <Plus size={20} />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create a New Goal</DialogTitle>
              <DialogDescription>
                Set up a new savings goal to track your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <GoalForm userId={loggedIn.$id} accounts={accounts} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-6">
        <GoalsList goals={goals} accounts={accounts} />
      </div>
    </section>
  )
}

export default Savings

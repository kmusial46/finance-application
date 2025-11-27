"use client"

import React from 'react'
import { Progress } from "@/components/ui/progress"
import { formatAmount, cn } from "@/lib/utils"
import { Calendar, Wallet, Link as LinkIcon } from 'lucide-react'
import { Button } from '../button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import GoalDetails from './goal-details'

interface GoalCardProps {
  goal: Goal;
  account?: Account; // For linked goals
}

const GoalCard = ({ goal, account }: GoalCardProps) => {
  // Determine current amount
  // If linked, use account balance. If manual, use goal.currentAmount
  const currentAmount = goal.type === 'linked' && account 
    ? account.currentBalance 
    : goal.currentAmount;

  const progress = Math.min(Math.round((currentAmount / goal.targetAmount) * 100), 100);
  
  // Calculate days remaining if target date exists
  const getDaysRemaining = () => {
    if (!goal.targetDate) return null;
    const target = new Date(goal.targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-16 font-semibold text-gray-900">{goal.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "text-10 font-medium px-2 py-0.5 rounded-full",
                  goal.type === 'linked' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                )}>
                  {goal.type === 'linked' ? 'Linked' : 'Manual'}
                </span>
                {daysRemaining !== null && (
                  <span className="text-10 text-gray-500 flex items-center gap-1 ml-2">
                    <Calendar size={12} /> {daysRemaining} days left
                  </span>
                )}
              </div>
            </div>
            <div className={cn("p-2 rounded-full", goal.type === 'linked' ? 'bg-blue-50' : 'bg-green-50')}>
              {goal.type === 'linked' ? <LinkIcon size={20} className="text-blue-600" /> : <Wallet size={20} className="text-green-600" />}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-12 font-medium">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900">{progress}%</span>
            </div>
            <Progress value={progress} className={cn("h-2", goal.type === 'linked' ? "bg-blue-100" : "bg-green-100")} indicatorClassName={goal.type === 'linked' ? "bg-blue-600" : "bg-green-600"} />
            <div className="flex justify-between items-end mt-2">
              <div className="flex flex-col">
                <span className="text-12 text-gray-500">Saved</span>
                <span className="text-14 font-bold text-gray-900">{formatAmount(currentAmount)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-12 text-gray-500">Target</span>
                <span className="text-14 font-medium text-gray-700">{formatAmount(goal.targetAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Goal Details</DialogTitle>
          <DialogDescription>Track your progress and manage contributions.</DialogDescription>
        </DialogHeader>
        <GoalDetails goal={goal} currentAmount={currentAmount} />
      </DialogContent>
    </Dialog>
  )
}

export default GoalCard

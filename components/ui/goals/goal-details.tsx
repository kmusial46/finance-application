"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatAmount, cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGoalTransaction, getGoalTransactions, deleteGoal } from '@/lib/actions/goal.actions'
import { Loader2, Plus, Minus, History, Trash2 } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

interface GoalDetailsProps {
  goal: Goal;
  currentAmount: number;
}

const GoalDetails = ({ goal, currentAmount }: GoalDetailsProps) => {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const progress = Math.min(Math.round((currentAmount / goal.targetAmount) * 100), 100);
  const remaining = Math.max(goal.targetAmount - currentAmount, 0);

  useEffect(() => {
    if (goal.type === 'manual') {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const history = await getGoalTransactions({ goalId: goal.$id });
          setTransactions(history);
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [goal.$id, goal.type]);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (!amount || isNaN(Number(amount))) return;
    
    setIsLoading(true);
    try {
      const val = Number(amount);
      const finalAmount = type === 'deposit' ? val : -val;

      const newTx = await createGoalTransaction({
        goalId: goal.$id,
        userId: goal.userId,
        amount: finalAmount,
        date: new Date().toISOString(),
        notes: type === 'deposit' ? 'Manual Deposit' : 'Manual Withdrawal'
      });

      setTransactions([newTx, ...transactions]);
      setAmount("");
      // In a real app we'd trigger a refresh of the parent or use a context to update the goal card immediately
      // For now, the user will see the update on refresh or re-open
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const performDelete = async () => {
    setIsLoading(true);
    try {
      await deleteGoal({ goalId: goal.$id });
      // navigate back to the savings page to close the dialog and refresh
      router.push('/savings');
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-12 text-gray-500">Current Saved</p>
          <p className="text-20 font-bold text-gray-900">{formatAmount(currentAmount)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-12 text-gray-500">Target Goal</p>
          <p className="text-20 font-bold text-gray-900">{formatAmount(goal.targetAmount)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-14">
          <span className="font-medium">Progress</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-12 text-gray-500 text-right">
          {formatAmount(remaining)} to go
        </p>
      </div>

      {/* Manual Controls */}
      {goal.type === 'manual' && (
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-14 font-semibold mb-4">Update Savings</h4>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input 
                id="amount" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
            </div>
            <Button 
              onClick={() => handleTransaction('deposit')} 
              disabled={isLoading || !amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? <Loader2 className="animate-spin size-4" /> : <Plus className="size-4 mr-1" />}
              Add
            </Button>
            <Button 
              onClick={() => handleTransaction('withdraw')} 
              disabled={isLoading || !amount}
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              {isLoading ? <Loader2 className="animate-spin size-4" /> : <Minus className="size-4 mr-1" />}
              Withdraw
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {goal.type === 'manual' && (
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-14 font-semibold mb-4 flex items-center gap-2">
            <History size={16} /> History
          </h4>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {loadingHistory ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.$id} className="flex justify-between items-center text-14">
                    <div>
                      <p className="font-medium text-gray-900">{tx.notes || 'Transaction'}</p>
                      <p className="text-12 text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                    <span className={cn("font-semibold", tx.amount > 0 ? "text-emerald-600" : "text-rose-600")}>
                      {tx.amount > 0 ? "+" : ""}{formatAmount(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-12 text-gray-500 text-center py-4">No contributions yet.</p>
            )}
          </ScrollArea>
        </div>
      )}

      {goal.type === 'linked' && (
        <div className="border-t border-gray-100 pt-6">
          <p className="text-14 text-gray-600 bg-blue-50 p-4 rounded-lg">
            This goal is linked to your bank account. The progress updates automatically based on your account balance.
          </p>
        </div>
      )}

      <div className="border-t border-gray-100 pt-6 mt-6">
        <Button 
          variant="ghost" 
          className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : <Trash2 className="size-4 mr-2" />}
          Delete Goal
        </Button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Delete Goal</h3>
            <p className="text-sm text-gray-600 mt-2">This will permanently delete the goal and its manual contributions. This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowConfirm(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button className="bg-rose-600 text-white" onClick={performDelete} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null} Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalDetails

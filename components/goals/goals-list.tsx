"use client"

import React from 'react'
import GoalCard from './goal-card'

interface GoalsListProps {
  goals: Goal[];
  accounts: Account[];
}

const GoalsList = ({ goals, accounts }: GoalsListProps) => {
  if (!goals || goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No goals yet</h3>
        <p className="text-gray-500 mt-1">Create your first savings goal to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => {
        // Find linked account if applicable
        const linkedAccount = goal.type === 'linked' 
          ? accounts.find(acc => acc.id === goal.linkedAccountId)
          : undefined;

        return (
          <GoalCard 
            key={goal.$id} 
            goal={goal} 
            account={linkedAccount}
          />
        )
      })}
    </div>
  )
}

export default GoalsList

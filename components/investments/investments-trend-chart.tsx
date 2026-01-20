"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatAmount } from '@/lib/utils';

interface InvestmentsTrendChartProps {
  data: {
    month: string;
    portfolioValue: number;
    totalCost: number;
  }[];
}

const InvestmentsTrendChart = ({ data }: InvestmentsTrendChartProps) => {
  return (
    <Card className="bg-white shadow-sm border-none h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-900">6-Month Portfolio Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [formatAmount(value), '']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="portfolioValue" 
                name="Portfolio Value" 
                stroke="#2563eb" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="totalCost" 
                name="Total Cost" 
                stroke="#16a34a" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentsTrendChart;

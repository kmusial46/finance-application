'use client';

import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect } from 'react';

interface AccountBreakdownProps {
    transactions?: Transaction[];
}

const AccountBreakdown = ({ transactions = [] }: AccountBreakdownProps) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const checkScreen = () => {
            setIsMobile(window.innerWidth < 768);
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const showRotateMessage = isMobile && isPortrait;

    // Process transactions for deposit vs withdrawal comparison
    const processTransactionData = () => {
        const monthlyData: Record<string, { month: string; deposits: number; withdrawals: number; date: Date }> = {};

        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const monthKey = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { 
                    month: monthKey, 
                    deposits: 0, 
                    withdrawals: 0,
                    date: new Date(date.getFullYear(), date.getMonth(), 1)
                };
            }

            if (transaction.amount > 0) {
                monthlyData[monthKey].deposits += transaction.amount;
            } else {
                monthlyData[monthKey].withdrawals += Math.abs(transaction.amount);
            }
        });

        return Object.values(monthlyData)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-6)
            .map(({ month, deposits, withdrawals }) => ({ month, deposits, withdrawals }));
    };

    // Process balance over time
    const processBalanceData = () => {
        if (transactions.length === 0) return [];

        // Sort transactions by date
        const sortedTransactions = [...transactions].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let runningBalance = 0;
        const balanceData: { date: string; balance: number }[] = [];

        sortedTransactions.forEach((transaction) => {
            runningBalance += transaction.amount;
            const formattedDate = new Date(transaction.date).toLocaleDateString('en-GB', {
                month: 'short',
                day: 'numeric',
            });

            balanceData.push({
                date: formattedDate,
                balance: runningBalance,
            });
        });

        // Sample data points if too many transactions
        if (balanceData.length > 30) {
            const interval = Math.floor(balanceData.length / 30);
            return balanceData.filter((_, index) => index % interval === 0);
        }

        return balanceData;
    };

    const depositWithdrawalData = processTransactionData();
    const balanceData = processBalanceData();

    const chartConfig = {
        deposits: {
            label: 'Deposits',
            color: '#04bf45',
        },
        withdrawals: {
            label: 'Withdrawals',
            color: '#f04438',
        },
        balance: {
            label: 'Balance',
            color: '#0747b6',
        },
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Account Breakdown</h2>

            {/* Deposit vs Withdrawal Bar Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Deposits vs Withdrawals</h3>
                {showRotateMessage ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                            <rect width="16" height="10" x="4" y="7" rx="2"/>
                            <path d="m10 11 2-2 2 2"/>
                        </svg>
                        <p className="text-center">Rotate your device to view chart</p>
                    </div>
                ) : depositWithdrawalData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={depositWithdrawalData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="month" 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickLine={{ stroke: '#e5e7eb' }}
                                    tickFormatter={(value) => `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                />
                                <ChartTooltip 
                                    content={<ChartTooltipContent className="bg-white" formatter={(value) => `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                />
                                <Legend />
                                <Bar dataKey="deposits" fill={chartConfig.deposits.color} radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="withdrawals" fill={chartConfig.withdrawals.color} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                 showRotateMessage ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                            <rect width="20" height="14" x="2" y="3" rx="2"/>
                            <path d="m9 10 2-2 2 2"/>
                            <path d="m9 14 2 2 2-2"/>
                        </svg>
                        <p className="text-center">Rotate your device to view chart</p>
                    </div>
                ) :    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No transaction data available
                    </div>
                )}
            </Card>

            {/* Balance Over Time Line Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Balance Over Time</h3>
                {showRotateMessage ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                            <rect width="16" height="10" x="4" y="7" rx="2"/>
                            <path d="m10 11 2-2 2 2"/>
                        </svg>
                        <p className="text-center">Rotate your device to view chart</p>
                    </div>
                ) : balanceData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={balanceData}>
                                <defs>
                                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartConfig.balance.color} stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor={chartConfig.balance.color} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickLine={{ stroke: '#e5e7eb' }}
                                    tickFormatter={(value) => `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                />
                                <ChartTooltip 
                                    content={<ChartTooltipContent className="bg-white" formatter={(value) => `£${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
                                    cursor={{ stroke: 'rgba(0, 0, 0, 0.1)', strokeWidth: 1 }}
                                />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="balance" 
                                    stroke={chartConfig.balance.color} 
                                    strokeWidth={2}
                                    fill="url(#balanceGradient)"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        No transaction data available
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AccountBreakdown;

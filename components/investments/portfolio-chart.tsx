'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { IChartApi } from 'lightweight-charts';
import { getStockCandles } from '@/lib/actions/finnhub.actions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortfolioChartProps {
  investments: Investment[];
}

const PortfolioChart = ({ investments }: PortfolioChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeRange, setTimeRange] = useState('1Y');
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const uniqueSymbols = Array.from(new Set(investments.map((inv) => inv.symbol)));
      const now = Math.floor(Date.now() / 1000);
      let from = now - 365 * 24 * 60 * 60; // Default 1Y

      if (timeRange === '1M') from = now - 30 * 24 * 60 * 60;
      if (timeRange === '3M') from = now - 90 * 24 * 60 * 60;
      if (timeRange === '6M') from = now - 180 * 24 * 60 * 60;
      if (timeRange === 'YTD') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
        from = startOfYear;
      }
      if (timeRange === 'ALL') from = now - 5 * 365 * 24 * 60 * 60; // Cap at 5 years for now

      const resolution = timeRange === '1M' || timeRange === '3M' ? 'D' : 'W';

      const candlesMap: Record<string, any> = {};

      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          const candles = await getStockCandles(symbol, resolution, from, now);
          if (candles && candles.t) {
            candlesMap[symbol] = candles;
          }
        })
      );

      // Combine candles
      // We need a unified timeline.
      const allTimestamps = new Set<number>();
      Object.values(candlesMap).forEach((c) => {
        c.t.forEach((t: number) => allTimestamps.add(t));
      });
      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

      const portfolioHistory = sortedTimestamps.map((t) => {
        let totalValue = 0;
        // For each investment, check if it was held at time t
        investments.forEach((inv) => {
          const purchaseTime = new Date(inv.purchaseDate).getTime() / 1000;
          if (purchaseTime <= t) {
            // Find price at time t
            const candles = candlesMap[inv.symbol];
            if (candles) {
              // Find closest candle before or at t
              // Since t comes from the candles themselves, we should find an exact match or close enough
              // But different stocks might have slightly different timestamps or missing data
              // Simple approach: find index of t in candles.t
              const index = candles.t.findIndex((time: number) => time === t);
              let price = 0;
              if (index !== -1) {
                price = candles.c[index];
              } else {
                // Fallback: find last known price before t
                // This is O(N) inside loop, could be optimized
                for (let i = 0; i < candles.t.length; i++) {
                  if (candles.t[i] <= t) {
                    price = candles.c[i];
                  } else {
                    break;
                  }
                }
              }
              totalValue += price * inv.shareCount;
            }
          }
        });
        return {
          time: new Date(t * 1000).toISOString().split('T')[0],
          value: totalValue,
        };
      });

      setChartData(portfolioHistory);
      setLoading(false);
    };

    if (investments.length > 0) {
      fetchHistory();
    }
  }, [investments, timeRange]);

  useEffect(() => {
    let chart: IChartApi | null = null;

    const initChart = async () => {
      if (!chartContainerRef.current) return;

      const { createChart, ColorType, AreaSeries } = await import('lightweight-charts');

      if (!chartContainerRef.current) return;

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        grid: {
          vertLines: { visible: false },
          horzLines: { color: '#f0f3fa' },
        },
      });

      const newSeries = chart.addSeries(AreaSeries, {
        lineColor: '#2962FF',
        topColor: '#2962FF',
        bottomColor: 'rgba(41, 98, 255, 0.28)',
      });

      newSeries.setData(chartData);
      chart.timeScale().fitContent();

      chartRef.current = chart;
    };

    initChart();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Portfolio Performance</CardTitle>
        <Tabs defaultValue="1Y" onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="3M">3M</TabsTrigger>
            <TabsTrigger value="6M">6M</TabsTrigger>
            <TabsTrigger value="YTD">YTD</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
            <TabsTrigger value="ALL">ALL</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full h-[300px]" />
        {loading && <div className="text-center text-sm text-gray-500 mt-2">Loading chart data...</div>}
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;

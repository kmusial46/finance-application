'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { IChartApi } from 'lightweight-charts';
import { getStockCandles } from '@/lib/actions/finnhub.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StockChartProps {
  symbol: string;
}

const StockChart = ({ symbol }: StockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeRange, setTimeRange] = useState('1Y');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = Math.floor(Date.now() / 1000);
      let from = now - 365 * 24 * 60 * 60; // Default 1Y

      if (timeRange === '1M') from = now - 30 * 24 * 60 * 60;
      if (timeRange === '3M') from = now - 90 * 24 * 60 * 60;
      if (timeRange === '6M') from = now - 180 * 24 * 60 * 60;
      if (timeRange === 'YTD') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
        from = startOfYear;
      }
      if (timeRange === 'ALL') from = now - 5 * 365 * 24 * 60 * 60;

      const resolution = timeRange === '1M' || timeRange === '3M' ? 'D' : 'W';

      const candles = await getStockCandles(symbol, resolution, from, now);

      if (candles && candles.t) {
        const data = candles.t.map((t: number, index: number) => ({
          time: new Date(t * 1000).toISOString().split('T')[0],
          value: candles.c[index],
        }));
        setChartData(data);
      } else {
        setChartData([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [symbol, timeRange]);

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
        height: 400,
        grid: {
          vertLines: { visible: false },
          horzLines: { color: '#f0f3fa' },
        },
      });

      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: '#2962FF',
        topColor: '#2962FF',
        bottomColor: 'rgba(41, 98, 255, 0.28)',
      });

      areaSeries.setData(chartData);
      chart.timeScale().fitContent();

      chartRef.current = chart;
    };

    if (chartData.length > 0) {
      initChart();
    }

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
    <div className="space-y-4">
      <div className="flex justify-end">
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
      </div>
      <div className="border rounded-md p-4">
        <div ref={chartContainerRef} className="w-full h-[400px]" />
        {loading && <div className="text-center text-sm text-gray-500 mt-2">Loading chart data...</div>}
        {!loading && chartData.length === 0 && (
          <div className="text-center text-sm text-gray-500 mt-2">No data available for this range.</div>
        )}
      </div>
    </div>
  );
};

export default StockChart;

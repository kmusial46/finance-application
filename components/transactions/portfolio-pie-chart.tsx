'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  type TooltipProps,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/utils';

interface PortfolioLineChartProps {
  data: Array<{ label: string; value: number }>;
}

const chartConfig: ChartConfig = {
  value: {
    label: 'Market Value',
    color: '#2563EB',
  },
};

const PortfolioPieChart = ({ data }: PortfolioLineChartProps) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    return data.map(({ label, value }) => ({
      label,
      value,
    }));
  }, [data]);

  const availableRanges = [3, 6, 12] as const;
  const [selectedRange, setSelectedRange] = useState<typeof availableRanges[number]>(6);

  const displayedData = useMemo(() => {
    if (!chartData.length) return [];

    const sliceCount = Math.min(selectedRange, chartData.length);
    return chartData.slice(chartData.length - sliceCount);
  }, [chartData, selectedRange]);

  if (!chartData.length) {
    return <p className="text-14 text-gray-500">Add holdings to see historical performance.</p>;
  }

  const tooltipFormatter: TooltipProps<string | number, string>["formatter"] = (value, _name, item) => {
    const numericValue = Number(value) || 0;
    const label = item?.payload?.label ?? _name;

    return (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatAmount(numericValue)}</span>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex justify-end gap-2">
        {availableRanges.map((range) => (
          <Button
            key={range}
            size="sm"
            variant={selectedRange === range ? 'default' : 'outline'}
            onClick={() => setSelectedRange(range)}
          >
            {range}m
          </Button>
        ))}
      </div>

      <ChartContainer
        config={chartConfig}
        className="h-[260px] w-full max-w-full"
      >
        <LineChart
          accessibilityLayer
          data={displayedData}
          margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={tooltipFormatter as TooltipProps<any, any>["formatter"]}
                nameKey="value"
              />
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <ChartLegend
            verticalAlign="bottom"
            content={<ChartLegendContent nameKey="value" />}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default PortfolioPieChart;

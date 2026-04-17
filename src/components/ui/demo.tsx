"use client";

import {
  AreaChart,
  Area,
  Grid,
  XAxis,
  ChartTooltip,
} from "@/components/ui/area-chart";

type Point = { date: Date; revenue: number; costs: number };

interface Props {
  data?: Point[];
  currencySymbol?: string;
}

// Build 30-day zeroed scaffold so empty state still renders the axis/grid
function emptyScaffold(): Point[] {
  const out: Point[] = [];
  for (let i = 29; i >= 0; i--) {
    out.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      revenue: 0,
      costs: 0,
    });
  }
  return out;
}

export default function AreaChartDemo({ data, currencySymbol = "£" }: Props) {
  const chartData = data && data.length > 0 ? data : emptyScaffold();
  return (
    <div className="w-full">
      <AreaChart data={chartData}>
        <Grid horizontal />
        <Area
          dataKey="revenue"
          fill="var(--chart-line-primary)"
          fillOpacity={0.3}
          fadeEdges
        />
        <Area
          dataKey="costs"
          fill="var(--chart-line-secondary)"
          fillOpacity={0.3}
          fadeEdges
        />
        <XAxis />
        <ChartTooltip
          rows={(point) => [
            {
              color: "var(--chart-line-primary)",
              label: "Income",
              value: `${currencySymbol}${((point.revenue as number) || 0).toLocaleString()}`,
            },
            {
              color: "var(--chart-line-secondary)",
              label: "Expenses",
              value: `${currencySymbol}${((point.costs as number) || 0).toLocaleString()}`,
            },
          ]}
        />
      </AreaChart>
    </div>
  );
}

"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

// import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Task productivity chart"

interface DashboardData {
  tasks: { id: string; status: string; updated_at: string; created_at: string }[];
  staff: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalStaff: number;
    totalTeams: number;
  };
}

const generateTaskChartData = (tasks: { id: string; status: string; updated_at: string; created_at: string }[]) => {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completed = tasks.filter(task => 
      task.updated_at.startsWith(dateStr) && task.status === "completed"
    ).length;
    
    const created = tasks.filter(task => 
      task.created_at.startsWith(dateStr)
    ).length;
    
    last7Days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed,
      created,
    });
  }
  return last7Days;
};

export function ChartAreaInteractive({ data }: { data: DashboardData }) {
  const chartData = generateTaskChartData(data.tasks);
  // const isMobile = useIsMobile()
  const [dateRange, setDateRange] = React.useState("7d")
  const [chartType, setChartType] = React.useState("area")

  const chartConfig = {
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-1))",
    },
    created: {
      label: "Created",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Productivity</CardTitle>
        <CardDescription>
          Task completion and creation trends over the last 7 days
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup
              type="single"
              value={chartType}
              onValueChange={(value) => value && setChartType(value)}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="area" aria-label="Toggle area">
                Area
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="Toggle line">
                Line
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="var(--color-completed)"
              fillOpacity={0.4}
              stroke="var(--color-completed)"
              stackId="a"
            />
            <Area
              dataKey="created"
              type="natural"
              fill="var(--color-created)"
              fillOpacity={0.4}
              stroke="var(--color-created)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
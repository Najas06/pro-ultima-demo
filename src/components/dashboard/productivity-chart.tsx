"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { 
  IconTrendingUp, 
  IconTrendingDown,
  IconCalendar,
  IconTarget
} from "@tabler/icons-react";

interface ProductivityChartProps {
  tasks: Task[];
}

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
};

const getTasksByDate = (tasks: Task[], date: Date) => {
  const dateStr = date.toISOString().split('T')[0];
  
  return {
    completed: tasks.filter(task => 
      task.updated_at.startsWith(dateStr) && task.status === "completed"
    ).length,
    created: tasks.filter(task => 
      task.created_at.startsWith(dateStr)
    ).length,
    total: tasks.filter(task => 
      task.created_at.startsWith(dateStr) || 
      task.updated_at.startsWith(dateStr)
    ).length
  };
};

const getWeekdayName = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const getMaxValue = (data: { completed: number; created: number; total: number }[]) => {
  return Math.max(...data.map(d => Math.max(d.completed, d.created, d.total)), 1);
};

export function ProductivityChart({ tasks }: ProductivityChartProps) {
  const last7Days = getLast7Days();
  const chartData = last7Days.map(date => ({
    date,
    ...getTasksByDate(tasks, date)
  }));

  const maxValue = getMaxValue(chartData);
  
  // Calculate weekly stats
  const weeklyCompleted = chartData.reduce((sum, day) => sum + day.completed, 0);
  const weeklyCreated = chartData.reduce((sum, day) => sum + day.created, 0);
  const weeklyTotal = chartData.reduce((sum, day) => sum + day.total, 0);
  
  const completionRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;
  const productivityTrend = weeklyCompleted > weeklyCreated ? "up" : "down";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Productivity Overview</CardTitle>
            <CardDescription>
              Task completion and creation trends over the last 7 days
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Created</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Weekly Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{weeklyCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weeklyCreated}</div>
              <div className="text-xs text-muted-foreground">Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
          </div>

          {/* Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Last 7 Days</span>
              <div className="flex items-center gap-1">
                {productivityTrend === "up" ? (
                  <IconTrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <IconTrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={productivityTrend === "up" ? "text-green-600" : "text-red-600"}>
                  {productivityTrend === "up" ? "Improving" : "Declining"}
                </span>
              </div>
            </div>
            
            <div className="flex items-end justify-between h-32 gap-1">
              {chartData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex flex-col items-center gap-1 w-full h-24">
                    {/* Completed bar */}
                    <div 
                      className="w-full bg-green-500 rounded-t-sm transition-all duration-300"
                      style={{ 
                        height: `${(day.completed / maxValue) * 80}px`,
                        minHeight: day.completed > 0 ? '4px' : '0px'
                      }}
                    ></div>
                    
                    {/* Created bar */}
                    <div 
                      className="w-full bg-blue-500 rounded-b-sm transition-all duration-300"
                      style={{ 
                        height: `${(day.created / maxValue) * 80}px`,
                        minHeight: day.created > 0 ? '4px' : '0px'
                      }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {getWeekdayName(day.date)}
                  </div>
                  
                  <div className="text-xs font-medium">
                    {day.completed + day.created}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Avg Daily</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(weeklyCompleted / 7)} completed
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconTarget className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Goal Progress</div>
                <div className="text-xs text-muted-foreground">
                  {completionRate >= 70 ? "On track" : "Needs attention"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

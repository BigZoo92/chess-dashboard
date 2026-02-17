import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RatingSeriesPoint, SummaryDto } from '@ecoconception/shared';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatShortDate } from '@/lib/format';

const chartGridColor = 'rgba(231, 229, 228, 0.18)';
const chartAxisColor = 'rgba(231, 229, 228, 0.25)';
const chartTickColor = '#d6d3d1';
const chartTooltipStyle = {
  backgroundColor: '#111914',
  border: '1px solid rgba(231, 229, 228, 0.2)',
  color: '#f5f5f4'
};

type DashboardChartsProps = {
  ratingPoints: RatingSeriesPoint[];
  byTimeClass: SummaryDto['byTimeClass'];
};

export function DashboardCharts({ ratingPoints, byTimeClass }: DashboardChartsProps) {
  return (
    <>
      <Card className="border-stone-200/10 bg-[#141c17] text-stone-100">
        <CardHeader>
          <CardTitle className="text-stone-100">Rating series</CardTitle>
          <CardDescription className="text-stone-300">Evolution du rating partie par partie.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ratingPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis
                dataKey="endTime"
                tickFormatter={(value) => formatShortDate(value)}
                minTickGap={24}
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
                tick={{ fill: chartTickColor, fontSize: 12 }}
              />
              <YAxis
                domain={['auto', 'auto']}
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
                tick={{ fill: chartTickColor, fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value}`, 'rating']}
                labelFormatter={(value: number) => formatShortDate(value)}
                contentStyle={chartTooltipStyle}
                labelStyle={{ color: '#f5f5f4' }}
              />
              <Line type="monotone" dataKey="rating" stroke="#34d399" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-stone-200/10 bg-[#141c17] text-stone-100">
        <CardHeader>
          <CardTitle className="text-stone-100">Split by time class</CardTitle>
          <CardDescription className="text-stone-300">Volume de parties par cadence.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTimeClass}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis
                dataKey="timeClass"
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
                tick={{ fill: chartTickColor, fontSize: 12 }}
              />
              <YAxis
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
                tick={{ fill: chartTickColor, fontSize: 12 }}
              />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: '#f5f5f4' }} />
              <Bar dataKey="games" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

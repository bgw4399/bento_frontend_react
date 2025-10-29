'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

export function TopChart({ data }) {
  const chartData = data.map((item, index) => ({
    name: item.name,
    count: item.count,
    percentage: item.percentage,
    color: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  return (
    <div className="w-full">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 80, left: 120, bottom: 20 }}
          >
            <XAxis
              type="number"
              domain={[0, 300000]}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              width={110}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <span>0</span>
          <span>25k</span>
          <span>50k</span>
          <span>75k</span>
          <span>100k</span>
          <span>125k</span>
          <span>150k</span>
          <span>175k</span>
          <span>200k</span>
          <span>225k</span>
          <span>250k</span>
          <span>275k</span>
          <span>300k</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-sm font-medium text-muted-foreground">
          Participant Count
        </span>
      </div>
    </div>
  );
}

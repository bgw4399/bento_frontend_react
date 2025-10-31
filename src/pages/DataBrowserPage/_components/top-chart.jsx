'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from 'recharts';

export function TopChart({ data }) {
  const chartData = (data ?? []).map((item, index) => ({
    name: item.name,
    count: Number(item.count) || 0,
    color: `hsl(var(--chart-${(index % 5) + 1}, 0 0% 35%))`,
  }));

  const maxCount = Math.max(0, ...chartData.map((d) => d.count || 0));
  const step = 50000;
  const niceMax = Math.max(step, Math.ceil(maxCount / step) * step);
  const ticks = Array.from({ length: 7 }, (_, i) => Math.round((niceMax / 6) * i));

  // ✅ 데이터 개수에 맞춰 높이 계산 (행당 36px 정도)
  const rowHeight = 36;
  const chartHeight = Math.max(280, chartData.length * rowHeight + 40); // top/bottom 여유

  return (
    <div className="w-full">
      {/* ⬇️ 고정 h-80 지우고 동적 높이를 style로 지정 */}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 60, left: 150, bottom: 20 }} // 라벨 여유
            barCategoryGap={8} // 막대 간격 살짝 좁힘
          >
            <XAxis
              type="number"
              domain={[0, niceMax]}
              ticks={ticks}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground, 0 0% 45%))' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              interval={0}                 // ✅ 모든 라벨 강제 노출
              width={140}                  // ✅ 라벨 폭 확보
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground, 0 0% 10%))' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center">
        <span className="text-sm font-medium text-muted-foreground">Participant Count</span>
      </div>
    </div>
  );
}

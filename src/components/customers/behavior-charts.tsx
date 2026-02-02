"use client";

import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, ComposedChart
} from "recharts";

export function BehaviorCharts({ 
  activityTrend, 
  conversionFunnel, 
  categoryInterests 
}: { 
  activityTrend: any[], 
  conversionFunnel: any[], 
  categoryInterests: any[] 
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Activity Trend */}
      <div className="h-[350px] w-full rounded-lg border p-4 bg-card">
        <h3 className="text-lg font-medium mb-4">주간 활동 트렌드 (방문 vs 행동)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="visits" name="방문 수" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="actions" name="행동 수 (클릭/조회)" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Funnel */}
      <div className="h-[350px] w-full rounded-lg border p-4 bg-card">
        <h3 className="text-lg font-medium mb-4">구매 전환 퍼널</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={conversionFunnel} margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="stage" type="category" width={100} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              formatter={(value: number) => [`${value}명`, "사용자 수"]}
            />
            <Bar dataKey="count" name="사용자 수" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
              {/* Label list could be added here for values */}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Interests */}
      <div className="h-[350px] w-full rounded-lg border p-4 bg-card md:col-span-2 lg:col-span-1">
        <h3 className="text-lg font-medium mb-4">관심 카테고리 점수</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryInterests}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" name="관심도 점수" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

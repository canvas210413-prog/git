"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function SegmentationCharts({ data }: { data: any[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="h-[300px] w-full rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">고객 분포 (세그먼트별)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}명`, "고객 수"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[300px] w-full rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">세그먼트별 매출 기여도</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
            <Tooltip 
              formatter={(value: number) => [`₩${value.toLocaleString()}`, "매출"]}
              labelStyle={{ color: "black" }}
            />
            <Legend />
            <Bar dataKey="revenue" name="총 매출" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

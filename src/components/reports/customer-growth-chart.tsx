"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface CustomerGrowthChartProps {
  data: any[];
}

export function CustomerGrowthChart({ data }: CustomerGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="active"
          name="활성 고객"
          stroke="#8884d8"
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
        <Line 
            type="monotone" 
            dataKey="new" 
            name="신규 고객"
            stroke="#82ca9d" 
            strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
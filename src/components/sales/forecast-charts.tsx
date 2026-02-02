"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ForecastChartsProps {
  revenueData: any[];
  pipelineData: any[];
}

export function ForecastCharts({ revenueData, pipelineData }: ForecastChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>매출 예측 (Revenue Forecast)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₩${value / 1000000}M`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "black" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="매출 (실적/예측)"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.2}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>구매 여정 파이프라인 (Purchase Journey)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={pipelineData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={120} style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === "value" ? formatCurrency(value) : value.toLocaleString(),
                    name === "value" ? "잠재 매출" : "고객 수"
                  ]}
                  labelStyle={{ color: "black" }}
                />
                <Legend />
                <Bar dataKey="count" name="고객 수" fill="#82ca9d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>단계별 전환율 (Conversion Rate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={false} />
                <YAxis unit="%" />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, "전환율"]}
                  labelStyle={{ color: "black" }}
                />
                <Bar dataKey="conversionRate" name="전환율" fill="#ffc658" radius={[4, 4, 0, 0]}>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-5 gap-1 text-xs text-center text-muted-foreground">
              {pipelineData.map((item, i) => (
                <div key={i} title={item.stage}>
                  {item.stage.split(' ')[0]}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

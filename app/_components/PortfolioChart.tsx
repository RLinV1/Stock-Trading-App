"use client";

import { useState, useEffect, memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getPortfolioSnapshots } from "../_util/portfolio";
import { PortfolioSnapshot } from "../_types/types";

interface PortfolioDataPoint {
  date: string;
  value: number;
}
interface PortfolioLineChartProps {
  portfolioValue: number;
  userId: string;
  initialDeposit: number;
  cashBalance: number;
}

const PortfolioLineChartComponent = ({
  portfolioValue,
  userId,
  initialDeposit,
  cashBalance,
}: PortfolioLineChartProps) => {
  const [performanceData, setPerformanceData] = useState<PortfolioDataPoint[]>(
    []
  );

  // const [getPortfolioSnapshots, setPortfolioSnapshots] = useState<Por

  useEffect(() => {
    const mapToDataPoints = (
      snapshots: PortfolioSnapshot[]
    ): PortfolioDataPoint[] => {
      return snapshots.map((snapshot, index) => {
        const value = snapshot.portfolioValue + cashBalance;
        const dt = new Date(snapshot.dateTime);
        const date = dt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        return {
          date,
          value,
        };
      });
    };

    const getPerformanceData = async (userId: string) => {
      const res = (await getPortfolioSnapshots(userId));
      console.log(res);
      const performanceData = mapToDataPoints(res);

      setPerformanceData(performanceData);
    };

    getPerformanceData(userId);
  }, [userId, portfolioValue]);

  useEffect(() => {
    setPerformanceData((prevData) => {
      const newData = [...prevData];
      const timestamp = Date.now();

      const dateStr = new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      if (newData.length === 0) {
        return [
          {
            value: portfolioValue,
            date: dateStr,
          },
        ];
      }
      const latest: PortfolioDataPoint = {
        value: portfolioValue,
        date: dateStr,
      };

      newData[newData.length - 1] = latest;

      return newData;
    });
  }, [portfolioValue]);

  if (performanceData.length === 0) {
    return <div>Loading chart...</div>;
  }

  const totalReturn = portfolioValue - initialDeposit;
  const isPositive = totalReturn >= 0;

  return (
    <div className="w-full max-w-4xl p-4 rounded-lg shadow-md bg-light-custom">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-foreground">
            $
            {portfolioValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span
            className={`text-sm font-medium ${
              isPositive ? "text-success" : "text-red-500"
            }`}
          >
            {isPositive ? "+" : "-"}${Math.abs(totalReturn).toFixed(2)} (
            {initialDeposit > 0 ? ((totalReturn / initialDeposit) * 100).toFixed(2) : "0.00"}%)
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Portfolio Value (30 days)
        </p>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="date"
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => {
                const profit = value - initialDeposit;
                const returnPct = initialDeposit > 0 ? ((value - initialDeposit) / initialDeposit) * 100 : 0;

                const formattedValue = `$${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;

                const color = profit >= 0 ? "limegreen" : "red";
                const sign = profit >= 0 ? "+" : "";

                return [
                  <span key="1" style={{ color }}>
                    {formattedValue} ({sign}{returnPct.toFixed(2)}%)
                  </span>,
                  "Portfolio",
                ];
              }}
              contentStyle={{ backgroundColor: "#222", borderColor: "#555" }}
              labelStyle={{ color: "#eee" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PortfolioLineChart = memo(PortfolioLineChartComponent);

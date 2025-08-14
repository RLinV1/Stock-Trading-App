"use client";

import { useState, useEffect, memo, use } from "react";
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
  percentageChange?: number;
}
interface PortfolioLineChartProps {
  portfolioValue: number;
  userId: string;
}

const PortfolioLineChartComponent = ({
  portfolioValue,
  userId,
}: PortfolioLineChartProps) => {
  const [performanceData, setPerformanceData] = useState<PortfolioDataPoint[]>(
    []
  );

  // const [getPortfolioSnapshots, setPortfolioSnapshots] = useState<Por

  useEffect(() => {
    const mapToDataPoints = (
      snapshots: PortfolioSnapshot[]
    ): PortfolioDataPoint[] => {
      return snapshots.map((snapshot, index, arr) => {
        const value = snapshot.portfolioValue; // or snapshot.value if your API uses that
        const dt = new Date(snapshot.dateTime);
        const date = dt.toLocaleTimeString("en-US", { hour12: false });

        const prevValue = portfolioValue;
        const percentageChange = ((value - prevValue) / prevValue) * 100;

        return {
          date,
          value,
          percentageChange: index === 0 ? undefined : percentageChange,
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

      if (newData.length === 0) {
        return [
          {
            value: portfolioValue,
            date: new Date(timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
            }),
          },
        ];
      }
      const latest: PortfolioDataPoint = {
        value: portfolioValue,
        date: new Date(timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        }),
        percentageChange: 0,
      };

      newData[newData.length - 1] = latest;

      return newData;
    });
  }, [portfolioValue]);

  if (performanceData.length === 0) {
    return <div>Loading chart...</div>;
  }

  const currentValue =
    performanceData[performanceData.length - 1]?.value || 100000;
  const totalReturn = currentValue - performanceData[0]?.value;
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
            {((totalReturn / 100000) * 100).toFixed(2)}%)
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
              formatter={(value: number, name: string, entry: any) => {
                const percentageChange = entry.payload?.percentageChange;

                const formattedValue = `$${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;

                const formattedPercentage =
                  percentageChange !== undefined
                    ? ` (${percentageChange.toFixed(2)}%)`
                    : "";

                    const color =
                      percentageChange !== undefined
                        ? percentageChange >= 0
                          ? "limegreen"
                          : "red"
                        : "white";

                    return [
                      <span style={{ color }}>{`${formattedValue}${formattedPercentage}`}</span>,
                      <span style={{ color }}>Value</span>,
                    ];
              }}
              contentStyle={{ backgroundColor: "#222", borderColor: "#555" }} // dark background + border
              labelStyle={{ color: "#eee" }} // label text color (date)
              itemStyle={{ color: "limegreen" }} // value text color
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

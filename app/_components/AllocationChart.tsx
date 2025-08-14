import { memo, useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { UserStock } from "../_types/types";

interface AllocationData {
  name: string;
  value: number;
  color: string;
}
interface AllocationChartComponentProps {
  data: UserStock[];
  portfolioValue: number;

}

const AllocationChartComponent = ({data, portfolioValue} : AllocationChartComponentProps) => {
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  useEffect(() => {
      // console.log("AllocationChart data:", data);

      const newAllocationData: AllocationData[] = [];

      for (const item of data) {
        if (item.stock) {
          const percentage = Number((((item.shares * item.stock.currentPrice) / portfolioValue) * 100).toFixed(2));

          let color = "hsl(var(--danger))"; // Default color

          if (percentage < 1) {
            continue; // Skip entries with less than 1% allocation
          } else if (percentage > 50) {
            color = "hsl(var(--success))";
          } else if (percentage > 20) {
            color = "hsl(var(--warning))";
          } else if (percentage > 10) {
            color = "hsl(var(--accent))";
          }
          newAllocationData.push({
            name: item.stock.symbol,
            value: percentage,
            color: color, 
          });
        }
      }

      setAllocationData(newAllocationData);
    }, [data]);



  if (!data || data.length === 0) {
    return <div className="text-muted-foreground">No allocation data available</div>;
  }



  return (
    <div className="px-8 py-4 bg-light-custom  rounded-lg shadow-md w-full">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-foreground">
          Portfolio Allocation
        </h4>
        <p className="text-sm text-muted-foreground">
          Distribution of holdings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center  gap-6">
          <div className="h-64 w-64 ">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "limegreen",
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Allocation"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {allocationData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-foreground">{item.name}</span>
              </div>
              <span className="text-muted-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AllocationChart = memo(AllocationChartComponent);

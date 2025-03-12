"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Config, Result } from "@/lib/types";
import { transformDataForMultiLineChart } from "@/lib/rechart-format";

function toTitleCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

export function DynamicChart({
  chartData,
  chartConfig,
}: {
  chartData: Result[];
  chartConfig: Config;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const renderChart = () => {
    if (!chartData || !chartConfig) return <div>No chart data</div>;

    // Convert numeric fields to numbers
    const parsedChartData = chartData.map((item) => {
      const parsedItem: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(item)) {
        parsedItem[key] = isNaN(Number(value)) ? value : Number(value);
      }
      return parsedItem;
    });

    chartData = parsedChartData;

    // Limit or transform data if needed
    const processChartData = (data: Result[], chartType: string) => {
      if (chartType === "bar" || chartType === "pie") {
        // Example: limit to first 20 data points
        return data.length <= 20 ? data : data.slice(0, 20);
      }
      return data;
    };

    chartData = processChartData(chartData, chartConfig.type);

    switch (chartConfig.type) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey}>
              <Label
                value={toTitleCase(chartConfig.xKey)}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis>
              <Label
                value={toTitleCase(chartConfig.yKeys.join(", "))}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
      
            {/* For each yKey, create a bar and map over each data point for unique color. */}
            {chartConfig.yKeys.map((key, seriesIndex) => (
              <Bar key={key} dataKey={key}>
                {chartData.map((_, dataIndex) => (
                  <Cell
                    key={`cell-${dataIndex}`}
                    fill={colors[(dataIndex + seriesIndex) % colors.length]}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        );
      case "line": {
        const { data, xAxisField, lineFields } = transformDataForMultiLineChart(
          chartData,
          chartConfig,
        );
        const useTransformedData =
          chartConfig.multipleLines &&
          chartConfig.measurementColumn &&
          chartConfig.yKeys.includes(chartConfig.measurementColumn);

          return (
            <div>
              <LineChart data={useTransformedData ? data : chartData} width={700} height={300}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chartConfig.xKey}>
                  <Label
                    value={toTitleCase(useTransformedData ? xAxisField : chartConfig.xKey)}
                    offset={0}
                    position="insideBottom"
                  />
                </XAxis>
                <YAxis>
                  <Label
                    value={toTitleCase(chartConfig.yKeys[0])}
                    angle={-90}
                    position="insideLeft"
                  />
                </YAxis>
                <ChartTooltip content={<ChartTooltipContent />} />
                {chartConfig.legend && <Legend />}
          
                {useTransformedData
                  ? lineFields.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                      />
                    ))
                  : chartConfig.yKeys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                      />
                    ))}
              </LineChart>
            </div>
          );
          

            {/* If you want an area overlay, render it here or in case "area": */}
            {/* 
            {chartConfig.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
              />
            ))}
        //     */}
        //   </>
        // );
      }
      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={chartConfig.yKeys[0]}
              nameKey={chartConfig.xKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
          </PieChart>
        );
      case "scatter":
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey={chartConfig.xKey}
              name={toTitleCase(chartConfig.xKey)}
            >
              <Label
                value={toTitleCase(chartConfig.xKey)}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey={chartConfig.yKeys[0]}
              name={toTitleCase(chartConfig.yKeys[0])}
            >
              <Label
                value={toTitleCase(chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            {chartConfig.legend && <Legend />}
            <RechartsTooltip content={<ChartTooltipContent />} />
            <Scatter
              name={toTitleCase(chartConfig.yKeys[0])}
              data={chartData}
              fill={colors[0]}
            />
          </ScatterChart>
        );

        case "area": {
          return (
            <AreaChart data={chartData} width={500} height={300}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartConfig.xKey}>
                <Label
                  value={toTitleCase(chartConfig.xKey)}
                  offset={0}
                  position="insideBottom"
                />
              </XAxis>
              <YAxis>
                <Label
                  value={toTitleCase(chartConfig.yKeys.join(", "))}
                  angle={-90}
                  position="insideLeft"
                />
              </YAxis>
              <ChartTooltip content={<ChartTooltipContent />} />
              {chartConfig.legend && <Legend />}
        
              {/* For each yKey, create an area. */}
              {chartConfig.yKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                />
              ))}
            </AreaChart>
          );
        }



      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <h2 className="text-lg font-bold mb-2">{chartConfig.title}</h2>
      {chartConfig && chartData.length > 0 && (
        <ChartContainer
          config={chartConfig.yKeys.reduce(
            (acc, key, index) => {
              acc[key] = {
                label: key,
                color: colors[index % colors.length],
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
          className="h-[320px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      )}
      <div className="w-full">
        <p className="mt-4 text-sm">{chartConfig.description}</p>
        <p className="mt-4 text-sm">{chartConfig.takeaway}</p>
      </div>
    </div>
  );
}

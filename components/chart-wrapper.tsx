// "use client";

// import dynamic from "next/dynamic";
// import { ChartConfig, ChartData } from "@/types"; // Adjust the path as needed

// // Dynamically import the DynamicChart component with SSR disabled
// const DynamicChartNoSSR = dynamic(() => import("./dynamic-chart").then((mod) => mod.default) as any, {
//   ssr: false,
// });

// interface ChartWrapperProps {
//   chartData: ChartData;
//   chartConfig: ChartConfig;
// }

// export default function ChartWrapper({ chartData, chartConfig }: ChartWrapperProps) {
//   return <DynamicChartNoSSR chartData={chartData} chartConfig={chartConfig} />;
// }

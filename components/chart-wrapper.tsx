// "use client";

// import dynamic from "next/dynamic";
// import ChartWrapper from "@/components/chart-wrapper";

// // Dynamically import the chart with SSR disabled
// const DynamicChartNoSSR = dynamic(() => import("./dynamic-chart"), {
//   ssr: false,
// });

// // Then simply export a wrapper or directly render it
// export default function ChartWrapper({
//   chartData,
//   chartConfig,
// }: {
//   chartData: any;
//   chartConfig: any;
// }) {
//   return (
//     <DynamicChartNoSSR chartData={chartData} chartConfig={chartConfig} />
//   );
// }

// export default function SomePageOrComponent() {
//   const data = [...];        // chart data
//   const config = {...};      // chart config

//   return <ChartWrapper chartData={data} chartConfig={config} />;
// }
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function DynamicBarChart({
  data = [],
  className = "w-full h-96",
  colors = ["#E94E77", "#4D91CD", "#57C293", "#F2B53C", "#AB63EB", "#FF9E64"],
}) {
  // Function to detect the first non-numeric key for X axis
  const getXAxisKey = (data) => {
    if (!data || data.length === 0) return "";

    const firstItem = data[0];
    const keys = Object.keys(firstItem);

    // Find the first non-numeric key to use as X-axis
    return keys.find((key) => isNaN(parseFloat(firstItem[key]))) || keys[0];
  };

  // Function to get all numeric keys for potential Y axes
  const getDataKeys = (data) => {
    if (!data || data.length === 0) return [];

    const firstItem = data[0];
    const keys = Object.keys(firstItem);

    // Get all keys with numeric values
    return keys.filter((key) => !isNaN(parseFloat(firstItem[key])));
  };

  // Extract X-axis and data keys
  const xAxisKey = useMemo(() => getXAxisKey(data), [data]);
  const dataKeys = useMemo(() => getDataKeys(data), [data]);

  // Generate chart config dynamically
  const chartConfig = useMemo(() => {
    const config = {};

    dataKeys.forEach((key, index) => {
      config[key] = {
        label:
          key === "stock"
            ? "Tesla Stock Price"
            : key.charAt(0).toUpperCase() + key.slice(1),
        color: key === "stock" ? "#E94E77" : colors[index % colors.length],
      };
    });

    return config;
  }, [dataKeys, colors]);

  // Handle empty data case
  if (data.length === 0 || dataKeys.length === 0) {
    return <div className="p-4 text-center">No data available to display</div>;
  }

  return (
    <ChartContainer config={chartConfig} className={className}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <YAxis axisLine={false} tickLine={false} tickMargin={10} />
        <ChartLegend content={<ChartLegendContent />} />
        <ChartTooltip content={<ChartTooltipContent />} />

        {/* Dynamically create bars for each data key */}
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={chartConfig[key].color}
            radius={4}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

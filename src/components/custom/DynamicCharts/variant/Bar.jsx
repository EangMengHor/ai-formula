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
  // 🧠 Identify x-axis key: the only string key (all others should be numeric)
  const xAxisKey = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return "";
    const sample = data[0];
    const keys = Object.keys(sample);
    return keys.find((key) => typeof sample[key] === "string") || keys[0];
  }, [data]);

  // 📊 Identify numeric data keys (exclude x-axis string key)
  const dataKeys = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const sample = data[0];
    return Object.keys(sample).filter(
      (key) => key !== xAxisKey && typeof sample[key] === "number",
    );
  }, [data, xAxisKey]);

  // 🎨 Generate chart config with dynamic colors + labels
  const chartConfig = useMemo(() => {
    const config = {};
    dataKeys.forEach((key, index) => {
      config[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: colors[index % colors.length],
      };
    });
    return config;
  }, [dataKeys, colors]);

  // 🚫 Handle no data
  if (!data.length || !dataKeys.length) {
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
        {dataKeys.map((key) => (
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

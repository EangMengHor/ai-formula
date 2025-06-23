import { useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function DynamicRadarChart({
  data = [],
  className = "mx-auto aspect-square max-h-[250px]",
  colors = ["#E94E77", "#4D91CD", "#57C293", "#F2B53C", "#AB63EB", "#FF9E64"],
}) {
  // Determine label and value keys (one string and one numeric)
  const { labelKey, valueKey } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return {};
    const sample = data[0];
    const keys = Object.keys(sample);
    const lKey = keys.find((key) => typeof sample[key] === "string");
    const numericKeys = keys.filter((key) => typeof sample[key] === "number");
    const vKey = numericKeys[0];
    return { labelKey: lKey, valueKey: vKey };
  }, [data]);

  if (!data.length || !labelKey || !valueKey) {
    return <div className="p-4 text-center">No data available to display</div>;
  }

  const chartConfig = {
    [valueKey]: {
      label: valueKey.charAt(0).toUpperCase() + valueKey.slice(1),
      color: colors[0],
    },
  };

  return (
    <ChartContainer config={chartConfig} className={className}>
      <RadarChart data={data}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey={labelKey} />
        <PolarGrid />
        <Radar
          dataKey={valueKey}
          fill={colors[0]}
          fillOpacity={0.6}
          dot={{ r: 4, fillOpacity: 1 }}
        />
      </RadarChart>
    </ChartContainer>
  );
}

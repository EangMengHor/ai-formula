import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import DynamicBarChart from "./variant/Bar";
import DynamicLineChart from "./variant/Line";
import DynamicAreaChart from "./variant/Area";
import DynamicPieChart from "./variant/PieChart";
import DynamicRadarChart from "./variant/RadarChart";
import { memo, useEffect, useState } from "react";
import { getGeneratedVisualization } from "@/services/getGeneratedVisualization";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const generateChartConfig = (data, colorPalette) => {
  if (!Array.isArray(data) || data.length === 0) return {};

  const firstItem = data[0];
  const xAxisKey = Object.keys(firstItem).find(
    (key) => typeof firstItem[key] === "string",
  );

  const numericKeys = Object.keys(firstItem).filter(
    (key) => key !== xAxisKey && typeof firstItem[key] === "number",
  );

  const config = {};
  numericKeys.forEach((key, index) => {
    config[key] = {
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      color: colorPalette[index % colorPalette.length],
    };
  });

  return config;
};
function Visualization({
  dataId = "",
  chartType = "line",
  dataName = "Chart",
  dataLabel = "Dynamic Chart",
}) {
  const [isGraphdataLoading, setIsGraphdataLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isError, setIsError] = useState(false);
  const [chartConfig, setChartConfig] = useState({});

  useEffect(() => {
    async function fetchVisualizationData() {
      setIsGraphdataLoading(true);
      try {
        const response = await getGeneratedVisualization(dataId);
        if (response.success && response.data) {
          const rawData = response.data;
          const colorPalette = response.chartConfig;
          setChartData(rawData.data);
          setChartConfig(generateChartConfig(rawData.data, colorPalette));
        }
      } catch (error) {
        console.error("Error fetching visualization data:", error);
        setIsError(true);
      } finally {
        setIsGraphdataLoading(false);
      }
    }
    if (dataId) {
      fetchVisualizationData();
    }
  }, [dataId]);

  if (isGraphdataLoading) {
    return (
      <div className="flex items-center justify-center w-full h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-g1"></div>
      </div>
    );
  }

  // Choose the proper chart component based on chartType
  let ChartComponent;
  switch (chartType) {
    case "bar":
      ChartComponent = DynamicBarChart;
      break;
    case "line":
      ChartComponent = DynamicLineChart;
      break;
    case "area":
      ChartComponent = DynamicAreaChart;
      break;
    case "pie":
      ChartComponent = DynamicPieChart;
      break;
    case "radar":
      ChartComponent = DynamicRadarChart;
      break;
    default:
      ChartComponent = DynamicLineChart;
  }

  return (
    <Card className="w-full shadow-lg border-2 border-g1">
      <CardHeader className="border-b">
        <CardTitle>{dataName}</CardTitle>
        <CardDescription>{dataLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full">
          <ChartComponent data={chartData} className="w-full h-96" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default memo(Visualization);

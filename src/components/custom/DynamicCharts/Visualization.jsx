import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import DynamicBarChart from "./variant/Bar";
export default function Visualization() {
  const chartData = [
    { month: "January 2019", stock: 350 },
    { month: "February 2019", stock: 370 },
    { month: "March 2019", stock: 360 },
    { month: "April 2019", stock: 380 },
    { month: "May 2019", stock: 400 },
    { month: "June 2019", stock: 420 },
    { month: "July 2019", stock: 410 },
    { month: "August 2019", stock: 430 },
    { month: "September 2019", stock: 440 },
    { month: "October 2019", stock: 450 },
    { month: "November 2019", stock: 460 },
    { month: "December 2019", stock: 470 },
    { month: "January 2020", stock: 480 },
    { month: "February 2020", stock: 490 },
    { month: "March 2020", stock: 500 },
    { month: "April 2020", stock: 510 },
    { month: "May 2020", stock: 520 },
    { month: "June 2020", stock: 530 },
    { month: "July 2020", stock: 540 },
    { month: "August 2020", stock: 550 },
    { month: "September 2020", stock: 560 },
    { month: "October 2020", stock: 570 },
    { month: "November 2020", stock: 580 },
    { month: "December 2020", stock: 590 },
    { month: "January 2021", stock: 600 },
    { month: "February 2021", stock: 610 },
    { month: "March 2021", stock: 620 },
    { month: "April 2021", stock: 630 },
    { month: "May 2021", stock: 640 },
    { month: "June 2021", stock: 650 },
    { month: "July 2021", stock: 660 },
    { month: "August 2021", stock: 670 },
    { month: "September 2021", stock: 680 },
    { month: "October 2021", stock: 690 },
    { month: "November 2021", stock: 700 },
    { month: "December 2021", stock: 710 },
    { month: "January 2022", stock: 720 },
    { month: "February 2022", stock: 730 },
    { month: "March 2022", stock: 740 },
    { month: "April 2022", stock: 750 },
    { month: "May 2022", stock: 760 },
    { month: "June 2022", stock: 770 },
    { month: "July 2022", stock: 780 },
    { month: "August 2022", stock: 790 },
    { month: "September 2022", stock: 800 },
    { month: "October 2022", stock: 810 },
    { month: "November 2022", stock: 820 },
    { month: "December 2022", stock: 830 },
    { month: "January 2023", stock: 840 },
    { month: "February 2023", stock: 850 },
    { month: "March 2023", stock: 860 },
    { month: "April 2023", stock: 870 },
    { month: "May 2023", stock: 880 },
  ];

  const chartConfig = {
    stock: { label: "Tesla Stock Price", color: "#E4E77" },
  };

  return (
    <ChartContainer config={chartConfig} className=" w-full">
      <DynamicBarChart data={chartData} className="w-full h-96" />
    </ChartContainer>
  );
}

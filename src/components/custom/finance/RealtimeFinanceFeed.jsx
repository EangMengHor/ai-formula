"use client";

import { financialFeedUrl } from "@/namespace/server";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCandlestick, Check, Coins, Loader2 } from "lucide-react";
import { authApi } from "@/services/authApi";

const tabValue = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];

export default function RealtimeFinanceFeed({ ticker, type, name = "" }) {
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [isRealtimeLoading, setIsRealtimeLoading] = useState(false);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [dateTabValue, setDateTabValue] = useState("1D");
  const [graphData, setGraphData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const intervalRef = useRef(null);
  const requestLockRef = useRef(false); // Lock to prevent concurrent requests
  const [iconSrc, setIconSrc] = useState("");
  const [timeAgo, setTimeAgo] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Update time ago every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (lastUpdateDate) {
        setTimeAgo(Math.floor((Date.now() - lastUpdateDate.getTime()) / 1000));
      }
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [lastUpdateDate]);

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        await authApi(async () => {
          const res = await axios.get(
            `${import.meta.env.VITE_SOCKET_URL}/finance/icon/financial:icon:${ticker}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
              responseType: "blob",
            },
          );

          if (res.status === 401) {
            throw new Error("Unauthorized: Invalid or expired access token.");
          }

          const imageUrl = URL.createObjectURL(res.data);
          setIconSrc(imageUrl);
        });
      } catch (error) {
        console.error("Error fetching icon:", error);
        if (error.response?.status === 401) {
          throw new Error("401 Unauthorized – please re-authenticate.");
        }
      }
    };
    console.log("fetchIcon called for ticker:", summaryData);
    if (
      summaryData &&
      summaryData?.image &&
      summaryData?.image !== "" &&
      !iconSrc
    ) {
      fetchIcon();
    }
  }, [ticker, summaryData]);
  useEffect(() => {
    async function fetchFinancialData(isInitialFetch = false) {
      // Check if a request is already in progress
      if (requestLockRef.current) {
        console.log("Request already in progress, skipping...");
        return;
      }
      try {
        requestLockRef.current = true;
        setHasError(false); // Reset error state on new request
        if (!isInitialFetch) {
          setIsRealtimeLoading(true);
        } else {
          setIsInitLoading(true);
        }
        const response = await axios.post(financialFeedUrl, {
          ticker: ticker,
          type: type,
          range: dateTabValue,
        });

        if (response?.data && response?.data?.success) {
          setGraphData(response?.data?.data);
          console.log("Graph data:", response?.data);
          setSummaryData({
            daily: response?.data?.dailySummary,
            current: response?.data?.currData,
            dayMove: response?.data?.dayMove,
            afterHours: response?.data?.afterHours,
            image: response?.data?.imageIcon || "",
            price: response?.data?.currentPrice,
          });
          setLastUpdateDate(new Date(response.data.responseDate));
        } else {
          // API returned unsuccessful response
          setHasError(true);
        }
      } catch (error) {
        console.error("Error fetching financial data:", error);
        setHasError(true);
        setLastUpdateDate(null);
      } finally {
        setIsRealtimeLoading(false);
        setIsInitLoading(false);
        // Release the lock
        requestLockRef.current = false;
      }
    }

    if (
      ticker &&
      typeof ticker === "string" &&
      ticker &&
      (type == "stock" || type == "crypto")
    ) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Reset the lock when starting fresh
      requestLockRef.current = false;

      fetchFinancialData(true);
      // start polling for real-time updates
      intervalRef.current = setInterval(
        () => {
          fetchFinancialData();
        },
        1000 * 60 * 2,
      ); // Poll every 2 minutes

      return () => {
        clearInterval(intervalRef.current); // Cleanup on unmount
        requestLockRef.current = false; // Reset lock on cleanup
      };
    }
  }, [dateTabValue, ticker, type]);

  // Format data for the chart
  const formatChartData = () => {
    if (!graphData || graphData.length === 0) return [];

    return graphData.map((item) => ({
      ...item,
      displayTime: dateTabValue === "1D" ? item.time : item.date,
      price: Number.parseFloat(item.price),
    }));
  };

  // Format X-axis labels
  const formatXAxisLabel = (value) => {
    if (dateTabValue === "1D") {
      // For 1D, show time (e.g., "7:25 am" -> "7:25")
      return value;
    } else {
      // For other periods, show date (e.g., "2025-07-25" -> "Jul 25")
      const date = new Date(value);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Determine if price is up or down for coloring
  const chartData = formatChartData();
  const isPositive =
    chartData.length > 1 &&
    chartData[chartData.length - 1]?.price > chartData[0]?.price;

  const chartConfig = {
    price: {
      label: "Price",
      color: isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)",
    },
  };

  // Return empty div if there's an error
  if (hasError) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col ">
      <div className="bg-gradient-to-r  from-g2/70 to-g1/70 rounded-2xl p-4">
        <div className="flex w-full justify-between items-center ">
          <div>
            {isInitLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
                <p>Loading {name} chart</p>
              </div>
            ) : (
              <div className="flex gap-2">
                {summaryData.image && summaryData.image !== "" && (
                  <img
                    src={iconSrc}
                    alt={`${name} icon`}
                    className="w-6 h-6 rounded-lg"
                  />
                )}
                <p className=" capitalize font-bold">{name}</p>
              </div>
            )}
          </div>

          {/* right */}
          <div className="flex gap-2">
            {type === "stock" ? (
              <ChartCandlestick width={20} height={20} />
            ) : (
              <Coins width={20} height={20} />
            )}
            <p className=" text-sm">{type == "stock" ? "Stock" : "Crypto"}</p>
          </div>
        </div>

        {!isInitLoading && (
          <div className="my-2">
            {/* realtime price */}
            <div className="flex gap-2 items-end">
              <div className="flex gap-2 items-end">
                <p className="text-4xl">
                  $
                  {(summaryData?.price || summaryData?.daily?.preMarket || 0)
                    ?.toFixed(2)
                    ?.toLocaleString()}
                </p>
                <p>USD</p>
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    summaryData?.dayMove?.direction === "up"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {summaryData?.dayMove?.hasValidData ? (
                    <p
                      className={`font-semibold ${
                        summaryData.dayMove.direction === "up"
                          ? "text-green-500"
                          : summaryData.dayMove.direction === "down"
                            ? "text-red-500"
                            : "text-gray-400"
                      }`}
                    >
                      {summaryData.dayMove.diff !== 0
                        ? `${summaryData.dayMove.diff < 0 ? "-" : "+"}$${Math.abs(summaryData.dayMove.diff).toFixed(2)} (${summaryData.dayMove.percent > 0 ? "+" : ""}${summaryData.dayMove.percent.toFixed(2)}%)`
                        : "No change (0.00%)"}
                    </p>
                  ) : (
                    <p className="text-gray-400">Movement data unavailable</p>
                  )}
                </p>
              </div>
            </div>

            {/* tabs */}
            <div className="flex gap-4 pt-4 border-b   border-gray-400/40">
              {tabValue.map((tab, index) => {
                const isActive = dateTabValue === tab;

                return (
                  <button
                    onClick={() => setDateTabValue(tab)}
                    className={`${isActive && "border-b-2  border-white"} pb-4 hover:text-white cursor-pointer `}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* graph */}
            {chartData.length > 0 && (
              <ChartContainer
                config={chartConfig}
                style={{
                  height: "240px",
                  width: "100%",
                  marginTop: "30px",
                }}
              >
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  {dateTabValue == "1D" && (
                    <ReferenceLine
                      y={summaryData?.daily?.open}
                      stroke="gray"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      label={({ viewBox }) => (
                        <text
                          x={viewBox.x + viewBox.width - 5} // Position within chart area
                          y={viewBox.y - 8}
                          fill="white" // Changed to white for visibility
                          fontSize={12}
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          Prev. Close : {summaryData?.daily?.open}
                        </text>
                      )}
                    />
                  )}
                  <CartesianGrid />
                  <XAxis
                    dataKey="displayTime"
                    tickFormatter={formatXAxisLabel}
                    interval={Math.floor(chartData.length / 4)} // Shows ~4-5 ticks
                    className="w-fit text-md"
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      } else {
                        return value.toFixed(0);
                      }
                    }}
                    domain={(() => {
                      const minPrice = Math.min(
                        ...chartData.map((d) => d.price),
                      );
                      const maxPrice = Math.max(
                        ...chartData.map((d) => d.price),
                      );
                      const range = maxPrice - minPrice;

                      // Dynamic padding based on range
                      let padding;
                      if (range > 10000)
                        padding = range * 0.05; // Large range - 5% padding
                      else if (range > 1000)
                        padding = range * 0.1; // Medium range - 10% padding
                      else if (range > 100)
                        padding = range * 0.15; // Small range - 15% padding
                      else padding = range * 0.2; // Very small range - 20% padding

                      return [minPrice - padding, maxPrice + padding];
                    })()}
                    ticks={(() => {
                      const minPrice = Math.min(
                        ...chartData.map((d) => d.price),
                      );
                      const maxPrice = Math.max(
                        ...chartData.map((d) => d.price),
                      );
                      const range = maxPrice - minPrice;

                      // Dynamic tick count and interval based on range
                      let tickCount, interval;

                      if (range > 10000) {
                        // Large range - fewer ticks, larger intervals
                        tickCount = 4;
                        interval =
                          Math.ceil(range / (tickCount - 1) / 1000) * 1000; // Round to nearest 1000
                      } else if (range > 1000) {
                        // Medium range - moderate ticks
                        tickCount = 5;
                        interval =
                          Math.ceil(range / (tickCount - 1) / 100) * 100; // Round to nearest 100
                      } else if (range > 100) {
                        // Small range - more ticks for detail
                        tickCount = 6;
                        interval = Math.ceil(range / (tickCount - 1) / 10) * 10; // Round to nearest 10
                      } else {
                        // Very small range - maximum detail
                        tickCount = 7;
                        interval = Math.ceil(range / (tickCount - 1)); // Round to nearest 1
                      }

                      // Generate ticks with calculated interval
                      const startTick =
                        Math.floor(minPrice / interval) * interval;
                      const ticks = [];

                      for (let i = 0; i < tickCount; i++) {
                        ticks.push(startTick + i * interval);
                      }

                      return ticks.filter(
                        (tick) =>
                          tick >= minPrice - range * 0.1 &&
                          tick <= maxPrice + range * 0.1,
                      );
                    })()}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="bg-white text-black p-3 rounded-lg shadow-lg border border-gray-200"
                        labelFormatter={(value) => {
                          if (dateTabValue === "1D") {
                            const currentDate = new Date().toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            );
                            return `${currentDate} • Time: ${value}`;
                          } else {
                            return `${value}`;
                          }
                        }}
                        formatter={(value) => [
                          `$${Number(value).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`,
                          " Price",
                        ]}
                      />
                    }
                  />
                  <Area
                    dataKey="price"
                    type="monotone"
                    fill={
                      summaryData?.dayMove?.direction === "up"
                        ? "hsl(142, 76%, 36%)"
                        : "hsl(0, 76%, 36%)"
                    }
                    fillOpacity={0.2}
                    stroke={
                      summaryData?.dayMove?.direction === "up"
                        ? "hsl(142, 76%, 36%)"
                        : "hsl(0, 76%, 36%)"
                    }
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
            {/* data */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Open</span>
                  <span className="text-sm font-medium text-white">
                    ${summaryData?.daily?.open?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">High</span>
                  <span className="text-sm font-medium text-white">
                    ${summaryData?.daily?.high?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Low</span>
                  <span className="text-sm font-medium text-white">
                    ${summaryData?.daily?.low?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Volume</span>
                  <span className="text-sm font-medium text-white">
                    {summaryData?.daily?.volume?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Pre Market</span>
                  <span className="text-sm font-medium text-white">
                    ${summaryData?.daily?.preMarket?.toLocaleString()}
                  </span>
                </div>
                {summaryData?.afterHours && summaryData?.afterHours?.price && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">After Hours</span>
                    <span className="text-sm font-medium text-white">
                      ${summaryData?.afterHours?.price?.toLocaleString()}
                      <span
                        className={`ml-2 text-xs ${
                          summaryData?.afterHours?.change >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        ({summaryData?.afterHours?.change >= 0 ? "+" : ""}
                        {summaryData?.afterHours?.changePercent?.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {!isInitLoading && (
        <div className="flex justify-between items-center px-4 py-2 bg-g2  rounded-b-2xl mx-4">
          {/* updated N second ago (add loading when it is updating <Loader2>) */}
          <div className="flex items-center gap-2">
            {isRealtimeLoading ? (
              <Loader2 className="animate-spin w-4 h-4 text-blue-400" />
            ) : (
              <Check className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm text-gray-400">
              {lastUpdateDate &&
                !isRealtimeLoading &&
                `Updated ${timeAgo} seconds ago`}
              {isRealtimeLoading && <p>Updating . . .</p>}
            </span>
          </div>

          {/* last updated date in right side */}
          <div className="text-xs text-gray-500">
            {lastUpdateDate &&
              lastUpdateDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
          </div>
        </div>
      )}
    </div>
  );
}

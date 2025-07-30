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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartCandlestick,
  Check,
  ChevronDown,
  Coins,
  Loader2,
} from "lucide-react";
import { authApi } from "@/services/authApi";

const tabValue = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];
const referenceLineRef = [
  {
    value: "prevClose",
    label: "Prev. Close",
  },
  {
    value: "todayPreMarket",
    label: "Today's Pre-market",
  },
  {
    value: "afterHour",
    label: "After Hour",
  },
  {
    value: "prevLow",
    label: "Prev. Low",
  },
  {
    value: "prevHigh",
    label: "Prev. High",
  },
  {
    value: "prevOpen",
    label: "Prev. Open",
  },
];
export default function RealtimeFinanceFeed({ ticker, type, name = "" }) {
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [isRealtimeLoading, setIsRealtimeLoading] = useState(false);
  const [isInitLoading, setIsInitLoading] = useState(true);
  const [dateTabValue, setDateTabValue] = useState("1D");
  const [graphData, setGraphData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [selectedReferenceLine, setSelectedReferenceLine] =
    useState("prevClose");
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
          console.log("Graph data:", {
            daily: response?.data?.dailySummary,
            current: response?.data?.currData,
            dayMove: response?.data?.dayMove,
            afterHours: response?.data?.afterHours,
            image: response?.data?.imageIcon || "",
            price: response?.data?.currentPrice,
            prev: response?.data?.previousSummary,
          });

          const summaryDataObj = {
            daily: response?.data?.dailySummary,
            current: response?.data?.currData,
            dayMove: response?.data?.dayMove,
            afterHours: response?.data?.afterHours,
            image: response?.data?.imageIcon || "",
            price: response?.data?.currentPrice,
            prev: response?.data?.previousSummary,
          };

          // Debug for reference line
          console.log("Setting summary data for", type, ticker, {
            hasClose: !!summaryDataObj?.prev?.close,
            closeValue: summaryDataObj?.prev?.close,
            closeType: typeof summaryDataObj?.prev?.close,
            dateTab: dateTabValue,
            fullPrev: summaryDataObj?.prev,
          });

          setSummaryData(summaryDataObj);
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

  // Get reference line value and label based on selection
  const getReferenceLineData = () => {
    if (!summaryData?.prev && !summaryData?.daily) return null;

    const referenceMap = {
      prevClose: {
        value: summaryData?.prev?.close,
        label: "Prev. Close",
      },
      todayPreMarket: {
        value: summaryData?.daily?.preMarket,
        label: "Today's Pre-market",
      },
      afterHour: {
        value: summaryData?.afterHours?.price,
        label: "After Hour",
      },
      prevLow: {
        value: summaryData?.prev?.low,
        label: "Prev. Low",
      },
      prevHigh: {
        value: summaryData?.prev?.high,
        label: "Prev. High",
      },
      prevOpen: {
        value: summaryData?.prev?.open,
        label: "Prev. Open",
      },
    };

    const selected = referenceMap[selectedReferenceLine];

    // Check if the value exists and is a valid number
    if (
      selected &&
      selected.value !== null &&
      selected.value !== undefined &&
      !isNaN(Number(selected.value))
    ) {
      return {
        ...selected,
        value: Number(selected.value), // Ensure it's a number
      };
    }

    return null;
  };

  const referenceLineData = getReferenceLineData();

  // Auto-fallback to available reference line if current selection is not available
  useEffect(() => {
    if (dateTabValue === "1D" && summaryData && !referenceLineData) {
      // Find the first available reference line
      const availableOptions = referenceLineRef.find((item) => {
        switch (item.value) {
          case "prevClose":
            return !!(
              summaryData?.prev?.close && !isNaN(Number(summaryData.prev.close))
            );
          case "todayPreMarket":
            return !!(
              summaryData?.daily?.preMarket &&
              !isNaN(Number(summaryData.daily.preMarket))
            );
          case "afterHour":
            return !!(
              summaryData?.afterHours?.price &&
              !isNaN(Number(summaryData.afterHours.price))
            );
          case "prevLow":
            return !!(
              summaryData?.prev?.low && !isNaN(Number(summaryData.prev.low))
            );
          case "prevHigh":
            return !!(
              summaryData?.prev?.high && !isNaN(Number(summaryData.prev.high))
            );
          case "prevOpen":
            return !!(
              summaryData?.prev?.open && !isNaN(Number(summaryData.prev.open))
            );
          default:
            return false;
        }
      });

      if (
        availableOptions &&
        selectedReferenceLine !== availableOptions.value
      ) {
        console.log(
          `Auto-switching from ${selectedReferenceLine} to ${availableOptions.value} (not available)`,
        );
        setSelectedReferenceLine(availableOptions.value);
      }
    }
  }, [summaryData, selectedReferenceLine, dateTabValue, referenceLineData]);

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
                {summaryData.image && summaryData.image !== "" && iconSrc && (
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
            <div className="flex gap-4 pt-4 border-b w-full justify-between  items-center border-gray-400/40">
              <div className="flex gap-4">
                {tabValue.map((tab, index) => {
                  const isActive = dateTabValue === tab;

                  return (
                    <button
                      key={index}
                      onClick={() => setDateTabValue(tab)}
                      className={`${isActive && "border-b-2  border-white"} pb-4 hover:text-white cursor-pointer `}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
              {dateTabValue === "1D" && (
                <div className="mb-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2  rounded-lg text-sm hover:text-white">
                      {referenceLineData?.label || "None"}
                      <ChevronDown className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900  rounded-xl border-0 shadow-md shadow-neutral-100">
                      <DropdownMenuLabel className="text-slate-300">
                        Select Reference Line
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-600" />
                      {referenceLineRef.map((item) => {
                        const isAvailable = (() => {
                          switch (item.value) {
                            case "prevClose":
                              return !!(
                                summaryData?.prev?.close &&
                                !isNaN(Number(summaryData.prev.close))
                              );
                            case "todayPreMarket":
                              return !!(
                                summaryData?.daily?.preMarket &&
                                !isNaN(Number(summaryData.daily.preMarket))
                              );
                            case "afterHour":
                              return !!(
                                summaryData?.afterHours?.price &&
                                !isNaN(Number(summaryData.afterHours.price))
                              );
                            case "prevLow":
                              return !!(
                                summaryData?.prev?.low &&
                                !isNaN(Number(summaryData.prev.low))
                              );
                            case "prevHigh":
                              return !!(
                                summaryData?.prev?.high &&
                                !isNaN(Number(summaryData.prev.high))
                              );
                            case "prevOpen":
                              return !!(
                                summaryData?.prev?.open &&
                                !isNaN(Number(summaryData.prev.open))
                              );
                            default:
                              return false;
                          }
                        })();

                        // Get the value for display
                        const getValue = () => {
                          if (!isAvailable) return "N/A";

                          switch (item.value) {
                            case "prevClose":
                              return Number(summaryData?.prev?.close).toFixed(
                                2,
                              );
                            case "todayPreMarket":
                              return Number(
                                summaryData?.daily?.preMarket,
                              ).toFixed(2);
                            case "afterHour":
                              return Number(
                                summaryData?.afterHours?.price,
                              ).toFixed(2);
                            case "prevLow":
                              return Number(summaryData?.prev?.low).toFixed(2);
                            case "prevHigh":
                              return Number(summaryData?.prev?.high).toFixed(2);
                            case "prevOpen":
                              return Number(summaryData?.prev?.open).toFixed(2);
                            default:
                              return "N/A";
                          }
                        };

                        return (
                          <DropdownMenuItem
                            key={item.value}
                            onClick={() => setSelectedReferenceLine(item.value)}
                            className={`text-slate-300 hover:bg-slate-700 cursor-pointer ${
                              selectedReferenceLine === item.value
                                ? "bg-slate-700"
                                : ""
                            } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={!isAvailable}
                          >
                            <div className="flex justify-between gap-2 w-full">
                              <span>{item.label}</span>
                              <span
                                className={`${isAvailable ? "text-slate-400" : "text-red-400"}`}
                              >
                                {isAvailable ? `$${getValue()}` : "N/A"}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* graph */}
            {chartData.length > 0 && (
              <div>
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
                    {dateTabValue === "1D" && referenceLineData && (
                      <ReferenceLine
                        y={Number(referenceLineData.value)}
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={({ viewBox }) => {
                          console.log("Reference line data:", {
                            selectedType: selectedReferenceLine,
                            value: referenceLineData.value,
                            label: referenceLineData.label,
                            type: type,
                            dateTab: dateTabValue,
                            viewBox: viewBox,
                            chartDataRange: {
                              min: Math.min(...chartData.map((d) => d.price)),
                              max: Math.max(...chartData.map((d) => d.price)),
                            },
                          });

                          if (!viewBox || !referenceLineData.value) return null;

                          return (
                            <text
                              x={viewBox.x + viewBox.width - 80}
                              y={viewBox.y - 5}
                              fill="#ffffff"
                              fontSize={12}
                              fontWeight="600"
                              textAnchor="end"
                              opacity={1}
                            >
                              {referenceLineData.label}: $
                              {Number(referenceLineData.value).toFixed(2)}
                            </text>
                          );
                        }}
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
                        // Ensure we have chart data
                        if (!chartData || chartData.length === 0) {
                          return [0, 100]; // Fallback domain
                        }

                        const prices = chartData
                          .map((d) => d.price)
                          .filter((p) => !isNaN(p));
                        if (prices.length === 0) {
                          return [0, 100]; // Fallback if no valid prices
                        }

                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);

                        // Include selected reference line in domain calculation if available
                        let domainMin = minPrice;
                        let domainMax = maxPrice;

                        if (
                          dateTabValue === "1D" &&
                          referenceLineData?.value &&
                          !isNaN(Number(referenceLineData.value))
                        ) {
                          const refValue = Number(referenceLineData.value);
                          domainMin = Math.min(minPrice, refValue);
                          domainMax = Math.max(maxPrice, refValue);
                        }

                        const range = domainMax - domainMin;

                        // Handle edge case where range is 0
                        if (range === 0) {
                          const center = domainMin || 100;
                          return [center * 0.99, center * 1.01];
                        }

                        // Dynamic padding based on range
                        let padding;
                        if (range > 10000)
                          padding = range * 0.05; // Large range - 5% padding
                        else if (range > 1000)
                          padding = range * 0.1; // Medium range - 10% padding
                        else if (range > 100)
                          padding = range * 0.15; // Small range - 15% padding
                        else padding = range * 0.2; // Very small range - 20% padding

                        console.log("Y-axis domain:", {
                          originalMin: minPrice,
                          originalMax: maxPrice,
                          selectedReference: selectedReferenceLine,
                          referenceValue: referenceLineData?.value,
                          finalMin: domainMin - padding,
                          finalMax: domainMax + padding,
                        });

                        return [domainMin - padding, domainMax + padding];
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
                          interval =
                            Math.ceil(range / (tickCount - 1) / 10) * 10; // Round to nearest 10
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
              </div>
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
                    {summaryData?.daily?.volume?.toLocaleString() || "N/A"}
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
                        ({summaryData?.afterHours?.percent >= 0 ? "+" : ""}
                        {summaryData?.afterHours?.percent?.toFixed(2)}%)
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

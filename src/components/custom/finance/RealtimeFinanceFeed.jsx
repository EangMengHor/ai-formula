"use client";

import { financialFeedUrl } from "@/namespace/server";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { ChartCandlestick, Coins, Loader2 } from "lucide-react";
import { authApi } from "@/services/authApi";

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
          setSummaryData({
            daily: response?.data?.dailySummary,
            current: response?.data?.currData,
            dayMove: response?.data?.dayMove,
            afterHours: response?.data?.afterHours,
            image: response?.data?.imageIcon || "",
            price: response?.data?.currentPrice,
          });
          setLastUpdateDate(new Date(response.data.responseDate));
        }
      } catch (error) {
        console.error("Error fetching financial data:", error);
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
      intervalRef.current = setInterval(() => {
        fetchFinancialData();
      }, 5000); // Poll every 5 seconds

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

  return (
    <div className="bg-gradient-to-r from-g2/70 to-g1/70 rounded-xl p-4">
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
                  src={iconSrc || "/placeholder.png"}
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
          <div>
            <p className="text-4xl">${summaryData.price}</p>
          </div>
        </div>
      )}
    </div>
  );
}

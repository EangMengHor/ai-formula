  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [isRealtimeLoading, setIsRealtimeLoading] = useState(false);
  const [dateTabValue, setDateTabValue] = useState("1D");
  const [graphData, setGraphData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const intervalRef = useRef(null);
  const requestLockRef = useRef(false); // Lock to prevent concurrent requests
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
    <div className="space-y-4 bg-black ">
      {/* Header with ticker info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-2xl font-bold">
              {ticker?.toUpperCase()}
            </CardTitle>
            {summaryData.current && (
              <Badge
                variant={
                  summaryData.dayMove?.direction === "up"
                    ? "default"
                    : "destructive"
                }
              >
                {summaryData.dayMove?.direction === "up" ? "+" : ""}
                {summaryData.dayMove?.diff}({summaryData.dayMove?.percent}%)
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${summaryData.price?.toFixed(2) || "--"}
            </div>
            {lastUpdateDate && (
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdateDate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Time period tabs */}
      <Tabs value={dateTabValue} onValueChange={setDateTabValue}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="1D">1D</TabsTrigger>
          <TabsTrigger value="1W">1W</TabsTrigger>
          <TabsTrigger value="1M">1M</TabsTrigger>
          <TabsTrigger value="3M">3M</TabsTrigger>
          <TabsTrigger value="1Y">1Y</TabsTrigger>
          <TabsTrigger value="5Y">5Y</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Chart */}
      <Card>
        <CardContent className="p-0 w-full">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="displayTime"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxisLabel}
                  interval="preserveStartEnd"
                  className="w-fit"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value.toFixed(0)}`}
                  domain={["dataMin - 1", "dataMax + 1"]}
                  className="w-fit px-2"
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        if (dateTabValue === "1D") {
                          return `Time: ${value}`;
                        } else {
                          return `Date: ${value}`;
                        }
                      }}
                      formatter={(value) => [`$${value.toFixed(2)}`, "Price"]}
                    />
                  }
                />
                <Area
                  dataKey="price"
                  type="monotone"
                  fill="var(--color-price)"
                  fillOpacity={0.2}
                  stroke="var(--color-price)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center text-muted-foreground">
              {isRealtimeLoading
                ? "Loading chart data..."
                : "No data available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      {summaryData.daily && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summaryData.daily.open}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summaryData.daily.high}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summaryData.daily.low}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
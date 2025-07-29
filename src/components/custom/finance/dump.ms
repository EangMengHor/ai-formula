   <Card>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="max-h-[300px]">
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
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        console.log(value, "value");
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
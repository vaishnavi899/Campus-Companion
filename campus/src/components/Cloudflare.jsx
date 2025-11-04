import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFetchWebAnalyticsAggregate,
  useFetchWebAnalyticsBrowser,
  useFetchWebAnalyticsOS,
  useFetchWebAnalyticsSparkline,
} from "@/hooks/cloudflare";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Cell, CartesianGrid, AreaChart, Area } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useThemeStore } from "@/stores/theme-store";
import PublicHeader from "./PublicHeader";
import DateRangeSelector from "./DateRangeSelector";

export default function Cloudflare() {
  // Subscribe to theme changes to trigger re-render
  const themeState = useThemeStore((state) => state.themeState);

  // Force re-render when theme changes
  const [, setForceUpdate] = useState({});
  useEffect(() => {
    setForceUpdate({});
  }, [themeState]);

  // Function to get chart color dynamically
  const getChartColor = (index) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--chart-${(index % 5) + 1}`)
      .trim();
  };

  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 7); // Last 7 days
    return { from, to };
  });

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  // Helper function to generate dynamic description based on date range
  const getDateRangeDescription = () => {
    const now = new Date();
    const diffMs = now.getTime() - dateRange.from.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Check if the 'to' date is within the last hour (considering it's "now")
    const isToDateRecent = now.getTime() - dateRange.to.getTime() < 60 * 60 * 1000;

    if (isToDateRecent) {
      if (diffMinutes <= 15) {
        return "last 15 minutes";
      } else if (diffMinutes <= 30) {
        return "last 30 minutes";
      } else if (diffMinutes <= 60) {
        return "last hour";
      } else if (diffHours <= 3) {
        return "last 3 hours";
      } else if (diffHours <= 6) {
        return "last 6 hours";
      } else if (diffHours <= 12) {
        return "last 12 hours";
      } else if (diffHours <= 24) {
        return "last 24 hours";
      } else if (diffDays <= 3) {
        return `last ${diffDays} days`;
      } else if (diffDays <= 7) {
        return "last 7 days";
      } else if (diffDays <= 14) {
        return "last 2 weeks";
      } else if (diffDays <= 30) {
        return "last 30 days";
      }
    }

    // Fallback to date range format for custom ranges with duration
    const customRangeDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));

    if (customRangeDays === 1) {
      return `${dateRange.from.toLocaleDateString()} (1 day)`;
    } else {
      return `${customRangeDays} days (${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()})`;
    }
  };

  const { data: aggregateData, isLoading: aggregateLoading } = useFetchWebAnalyticsAggregate(
    dateRange.from,
    dateRange.to
  );
  const { data: browserData, isLoading: browserLoading } = useFetchWebAnalyticsBrowser(dateRange.from, dateRange.to);
  const { data: osData, isLoading: osLoading } = useFetchWebAnalyticsOS(dateRange.from, dateRange.to);
  const { data: sparklineData, isLoading: sparklineLoading } = useFetchWebAnalyticsSparkline(
    dateRange.from,
    dateRange.to
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background">
        <PublicHeader showBackButton={true} />
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Stats for Nerds 🤓</h1>
            <p className="text-muted-foreground mt-1">Web Analytics Dashboard</p>
          </div>
          <DateRangeSelector dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
        </div>

        {/* Aggregate Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              {aggregateLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-primary text-2xl font-bold">{aggregateData?.visits.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              {aggregateLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-primary text-2xl font-bold">{aggregateData?.pageViews.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visits Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Visits Over Time</CardTitle>
            <CardDescription>Total visitor count over the {getDateRangeDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {sparklineLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : sparklineData?.visits && sparklineData.visits.length > 0 ? (
              <ChartContainer
                config={{
                  visits: {
                    label: "Visits",
                    color: getChartColor(0),
                  },
                }}
                className="h-[300px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={sparklineData.visits}
                  margin={{
                    left: -20,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <defs>
                    <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getChartColor(0)} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={getChartColor(0)} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString([], { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const date = new Date(payload[0].payload.timestamp);
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {date.toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                                {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: getChartColor(0) }}>
                                  {payload[0].value}
                                </span>
                                <span className="text-xs text-muted-foreground">visits</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke={getChartColor(0)}
                    fill="url(#visitsGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No visits data available</p>
            )}
          </CardContent>
        </Card>

        {/* Pageviews Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Page Views Over Time</CardTitle>
            <CardDescription>Total page views over the {getDateRangeDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {sparklineLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : sparklineData?.pageviews && sparklineData.pageviews.length > 0 ? (
              <ChartContainer
                config={{
                  pageviews: {
                    label: "Pageviews",
                    color: getChartColor(1),
                  },
                }}
                className="h-[300px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={sparklineData.pageviews}
                  margin={{
                    left: -20,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <defs>
                    <linearGradient id="pageviewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={getChartColor(1)} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={getChartColor(1)} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString([], { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const date = new Date(payload[0].payload.timestamp);
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">
                                {date.toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                                {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: getChartColor(1) }}>
                                  {payload[0].value}
                                </span>
                                <span className="text-xs text-muted-foreground">pageviews</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    stroke={getChartColor(1)}
                    fill="url(#pageviewsGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pageviews data available</p>
            )}
          </CardContent>
        </Card>

        {/* Browser and OS Stats - Side by Side on Desktop */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Browser Stats */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Browser Distribution</CardTitle>
              <CardDescription>Breakdown of visitors by browser</CardDescription>
            </CardHeader>
            <CardContent>
              {browserLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : browserData && browserData.length > 0 ? (
                <div className="space-y-6">
                  {/* Pie Chart */}
                  <ChartContainer
                    config={browserData.reduce((config, entry, index) => {
                      config[entry.browser] = {
                        label: entry.browser,
                        color: getChartColor(index),
                      };
                      return config;
                    }, {})}
                    className="mx-auto aspect-square max-h-[400px]"
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={browserData.map((entry, index) => ({
                          name: entry.browser,
                          count: entry.count,
                          fill: getChartColor(index),
                        }))}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={60}
                      />
                    </PieChart>
                  </ChartContainer>

                  {/* Bar Chart */}
                  <ChartContainer
                    config={browserData.reduce((config, entry, index) => {
                      config[entry.browser] = {
                        label: entry.browser,
                        color: getChartColor(index),
                      };
                      return config;
                    }, {})}
                    className="h-[300px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={browserData.map((entry) => ({
                        browser: entry.browser,
                        count: entry.count,
                      }))}
                      layout="vertical"
                      margin={{
                        left: 15,
                        right: 5,
                      }}
                    >
                      <XAxis type="number" dataKey="count" hide />
                      <YAxis
                        dataKey="browser"
                        type="category"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                        width={120}
                        className="text-xs"
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" labelKey="browser" />}
                      />
                      <Bar dataKey="count" name="Count" radius={5}>
                        {browserData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No browser data available</p>
              )}
            </CardContent>
          </Card>

          {/* OS Stats */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Operating System Distribution</CardTitle>
              <CardDescription>Breakdown of visitors by operating system</CardDescription>
            </CardHeader>
            <CardContent>
              {osLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : osData && osData.length > 0 ? (
                <div className="space-y-6">
                  {/* Pie Chart */}
                  <ChartContainer
                    config={osData.reduce((config, entry, index) => {
                      config[entry.os] = {
                        label: entry.os,
                        color: getChartColor(index),
                      };
                      return config;
                    }, {})}
                    className="mx-auto aspect-square max-h-[400px]"
                  >
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={osData.map((entry, index) => ({
                          name: entry.os,
                          count: entry.count,
                          fill: getChartColor(index),
                        }))}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={60}
                      />
                    </PieChart>
                  </ChartContainer>

                  {/* Bar Chart */}
                  <ChartContainer
                    config={osData.reduce((config, entry, index) => {
                      config[entry.os] = {
                        label: entry.os,
                        color: getChartColor(index),
                      };
                      return config;
                    }, {})}
                    className="h-[300px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={osData.map((entry) => ({
                        os: entry.os,
                        count: entry.count,
                      }))}
                      layout="vertical"
                      margin={{
                        left: 10,
                        right: 5,
                      }}
                    >
                      <XAxis type="number" dataKey="count" hide />
                      <YAxis
                        dataKey="os"
                        type="category"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                        width={70}
                        className="text-xs"
                      />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" labelKey="os" />} />
                      <Bar dataKey="count" name="Count" radius={5}>
                        {osData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No OS data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

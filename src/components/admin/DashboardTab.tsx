import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBox,
  FaCalendarAlt,
  FaChartLine,
  FaShoppingCart,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Define time range type
type TimeRangeType =
  | "today"
  | "yesterday"
  | "past_week"
  | "past_month"
  | "past_3_months"
  | "past_6_months"
  | "past_year"
  | "custom";

// Define time range options
const timeRangeOptions = [
  { label: "Today", value: "today" as TimeRangeType },
  { label: "Yesterday", value: "yesterday" as TimeRangeType },
  { label: "Past Week", value: "past_week" as TimeRangeType },
  { label: "Past Month", value: "past_month" as TimeRangeType },
  { label: "Past 3 Months", value: "past_3_months" as TimeRangeType },
  { label: "Past 6 Months", value: "past_6_months" as TimeRangeType },
  { label: "Past Year", value: "past_year" as TimeRangeType },
  { label: "Custom", value: "custom" as TimeRangeType },
];

export default function DashboardTab() {
  const [timeRange, setTimeRange] = useState<TimeRangeType>("today");
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const router = useRouter();
  const trpc = useTRPC();

  const revenueData = useQuery(
    trpc.analytics.getRevenue.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    })
  );

  const ordersData = useQuery(
    trpc.analytics.getOrders.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    })
  );

  const chartDataQuery = useQuery(
    trpc.analytics.getChartData.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    })
  );

  const recentOrdersData = useQuery(
    trpc.analytics.getRecentOrders.queryOptions({
      limit: 5,
    })
  );

  // Use API data or fallback to empty array if loading
  const revenue = revenueData.data || { amount: 0, percentChange: 0 };
  const orders = ordersData.data || { count: 0, percentChange: 0 };
  const chartData = chartDataQuery.data || [];
  const recentOrders = recentOrdersData.data || [];

  // Error handling for API requests
  const hasErrors =
    revenueData.error ||
    ordersData.error ||
    chartDataQuery.error ||
    recentOrdersData.error;
  const errorMessage = hasErrors
    ? "There was an error loading the dashboard data. Please try again later."
    : "";

  const handleTimeRangeChange = (range: TimeRangeType) => {
    setTimeRange(range);
    setShowTimeRangeDropdown(false);
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      setShowTimeRangeDropdown(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTimeRangeLabel = () => {
    return (
      timeRangeOptions.find((option) => option.value === timeRange)?.label ||
      "Custom Range"
    );
  };

  return (
    <div className="space-y-6">
      {/* Display error message if there are any errors */}
      {hasErrors && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {errorMessage}</span>
        </div>
      )}
      {/* Page Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] text-[var(--foreground)]"
          >
            <FaCalendarAlt className="text-[var(--primary)]" />
            <span>{getTimeRangeLabel()}</span>
          </button>

          {showTimeRangeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[color-mix(in_srgb,var(--foreground),var,--background_85%)] rounded-lg shadow-lg z-10">
              <div className="p-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-md ${timeRange === option.value ? "bg-[var(--primary)] text-white" : "hover:bg-gray-100 text-[var(--foreground)]"}`}
                  >
                    {option.label}
                  </button>
                ))}

                {timeRange === "custom" && (
                  <div className="p-2 space-y-2 border-t border-[color-mix(in_srgb,var(--foreground),var,--background_85%)] mt-2">
                    <div>
                      <label className="block text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full p-2 bg-white border border-[color-mix(in_srgb,var(--foreground),var,--background_85%)] rounded text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full p-2 bg-white border border-[color-mix(in_srgb,var(--foreground),var,--background_85%)] rounded text-[var(--foreground)]"
                      />
                    </div>
                    <button
                      onClick={handleApplyCustomRange}
                      className="w-full px-3 py-2 bg-[var(--primary)] text-white rounded-md"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <FaTachometerAlt />
          Dashboard Overview
        </h1>
      </div>{" "}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm font-medium">
                Total Revenue
              </h3>
              {revenueData.isLoading ? (
                <div className="h-9 w-32 bg-gray-100 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
                  {formatCurrency(revenue.amount)}
                </p>
              )}
            </div>
            {revenueData.isLoading ? (
              <div className="h-6 w-16 bg-gray-100 rounded animate-pulse"></div>
            ) : (
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${revenue.percentChange >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {revenue.percentChange >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(revenue.percentChange)}%
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
            <FaChartLine className="mr-1" />
            <span>Compared to previous period</span>
          </div>{" "}
        </div>
        {/* Orders Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm font-medium">
                Total Orders
              </h3>
              {ordersData.isLoading ? (
                <div className="h-9 w-16 bg-gray-100 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
                  {orders.count}
                </p>
              )}
            </div>
            {ordersData.isLoading ? (
              <div className="h-6 w-16 bg-gray-100 rounded animate-pulse"></div>
            ) : (
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${orders.percentChange >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {orders.percentChange >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(orders.percentChange)}%
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
            <FaChartLine className="mr-1" />
            <span>Compared to previous period</span>
          </div>
        </div>{" "}
      </div>
      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <FaChartLine />
          Revenue & Orders
        </h3>{" "}
        {chartDataQuery.isLoading ? (
          <div className="h-80 w-full bg-gray-100 rounded animate-pulse"></div>
        ) : chartData.length === 0 ? (
          <div className="h-80 w-full flex items-center justify-center text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
            No data available for the selected time range
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="time"
                  stroke="var(--foreground)"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--foreground)"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--foreground)"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    borderColor: "rgba(0,0,0,0.1)",
                    color: "var(--foreground)",
                  }}
                  formatter={(value, name) => {
                    if (name === "revenue") return [`$${value}`, "Revenue"];
                    return [value, "Orders"];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}{" "}
      </div>
      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[color-mix(in_srgb,var(--foreground),var,--background_85%)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <FaShoppingCart />
            Latest Completed Orders
          </h3>
        </div>

        {recentOrdersData.isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse flex flex-col md:flex-row md:items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-10"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FaShoppingCart className="text-gray-400 text-xl" />
            </div>
            <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] font-medium">No recent orders found</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} 
                className="cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-150 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                 onClick={() => router.push(`/admin/invoice/${order.id}`)}
                 >
                  <div className="flex items-center gap-3">
                    <div className="bg-[var(--primary)] bg-opacity-10 rounded-full p-2">
                      <FaShoppingCart className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">Order #{order.id}</p>
                      <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                        {format(parseISO(order.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 rounded-full p-2">
                      <FaUser className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{order.customer}</p>
                      <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">Customer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 rounded-full p-2">
                      <FaBox className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{order.items}</p>
                      <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">Items</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-[var(--primary)]">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

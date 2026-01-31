import { useTRPC } from "@/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
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
  FaBitcoin,
  FaEthereum,
  FaMousePointer,
  FaPercent,
} from "react-icons/fa";
import { SiLitecoin, SiSolana } from "react-icons/si";
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
import { CryptoType, PaymentType } from "@generated/browser";
import { PaymentMethodLogo } from "@/components/PaymentMethodLogo";

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

  // New state for crypto withdrawal dialog
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType | null>(null);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [withdrawalError, setWithdrawalError] = useState("");

  const router = useRouter();
  const trpc = useTRPC();

  // Check authentication first
  const authQuery = useQuery(trpc.auth.isAuthenticated.queryOptions());

  // Load crypto balances SEPARATELY (slow, don't block other data)
  const cryptoBalances = useQuery({
    ...trpc.crypto.getCryptoBalance.queryOptions(),
    enabled: authQuery.data?.authenticated === true,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1, // Only retry once if it fails
  });

  const revenueData = useQuery({
    ...trpc.analytics.getRevenue.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  const ordersData = useQuery({
    ...trpc.analytics.getOrders.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  const clickStatsData = useQuery({
    ...trpc.analytics.getClickStats.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  const chartDataQuery = useQuery({
    ...trpc.analytics.getChartData.queryOptions({
      timeRange,
      customRange:
        timeRange === "custom"
          ? { startDate: customStartDate, endDate: customEndDate }
          : undefined,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  const recentOrdersData = useQuery({
    ...trpc.analytics.getRecentOrders.queryOptions({
      limit: 5,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  // Add the new analytics queries
  const latestCompletedOrdersData = useQuery({
    ...trpc.analytics.getLatestCompletedOrders.queryOptions({
      limit: 5,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  const topProductsData = useQuery({
    ...trpc.analytics.getTopProducts.queryOptions({
      limit: 5,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  const topCustomersData = useQuery({
    ...trpc.analytics.getTopCustomers.queryOptions({
      limit: 5,
    }),
    enabled: authQuery.data?.authenticated === true,
  });

  // Add the mutation for sending crypto balance
  const sendBalanceMutation = useMutation(
    trpc.crypto.sendBalance.mutationOptions({
      onSuccess: () => {
        setIsWithdrawDialogOpen(false);
        setDestinationAddress("");
        cryptoBalances.refetch(); // Refresh balances after withdrawal
      },
      onError: (error) => {
        setWithdrawalError(
          error.message || "Failed to send funds. Please try again.",
        );
      },
    }),
  );

  // Use API data or fallback to empty array if loading
  const revenue = revenueData.data || { amount: 0, percentChange: 0 };
  const orders = ordersData.data || { count: 0, percentChange: 0 };
  const clickStats = clickStatsData.data || {
    clicks: 0,
    clicksPercentChange: 0,
    conversionRate: 0,
    conversionPercentChange: 0,
  };
  const chartData = chartDataQuery.data || [];
  const latestCompletedOrders = latestCompletedOrdersData.data || [];
  const topProducts = topProductsData.data || [];
  const topCustomers = topCustomersData.data || [];

  // Error handling for API requests
  const hasErrors =
    revenueData.error ||
    ordersData.error ||
    clickStatsData.error ||
    chartDataQuery.error ||
    recentOrdersData.error ||
    latestCompletedOrdersData.error ||
    topProductsData.error ||
    topCustomersData.error;
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

  // Handle opening the withdrawal dialog
  const handleOpenWithdraw = (type: CryptoType) => {
    setSelectedCrypto(type);
    setDestinationAddress("");
    setWithdrawalError("");
    setIsWithdrawDialogOpen(true);
  };

  // Handle withdrawal submission
  const handleWithdraw = () => {
    if (!selectedCrypto || !destinationAddress.trim()) {
      setWithdrawalError("Please enter a valid destination address.");
      return;
    }

    sendBalanceMutation.mutate({
      type: selectedCrypto,
      destination: destinationAddress.trim(),
    });
  };

  // Format crypto balance
  const formatCryptoBalance = (balance: number) => {
    return balance.toFixed(balance < 0.01 ? 8 : 4);
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
            className="flex items-center gap-2 px-4 py-2 bg-admin-card rounded-lg border border-admin-card-border text-foreground"
          >
            <FaCalendarAlt className="text-[var(--primary)]" />
            <span>{getTimeRangeLabel()}</span>
          </button>

          {showTimeRangeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-admin-card border border-admin-card-border rounded-lg shadow-lg z-10">
              <div className="p-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-md ${timeRange === option.value ? "bg-[var(--primary)] text-white" : "hover:bg-admin-hover text-foreground"}`}
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
                        className="w-full p-2 bg-admin-card border border-admin-card-border rounded text-foreground"
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
                        className="w-full p-2 bg-admin-card border border-admin-card-border rounded text-foreground"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm font-medium">
                Total Revenue
              </h3>
              {revenueData.isLoading ? (
                <div className="h-9 w-32 bg-surface-muted rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
                  {formatCurrency(revenue.amount)}
                </p>
              )}
            </div>
            {revenueData.isLoading ? (
              <div className="h-6 w-16 bg-surface-muted rounded animate-pulse"></div>
            ) : (
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${revenue.percentChange >= 0 ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"}`}
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
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
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
              <div className="h-6 w-16 bg-surface-muted rounded animate-pulse"></div>
            ) : (
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${orders.percentChange >= 0 ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"}`}
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
        </div>

        {/* Total Clicks Card */}
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm font-medium">
                Total Clicks
              </h3>
              {clickStatsData.isLoading ? (
                <div className="h-9 w-16 bg-gray-100 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
                  {clickStats.clicks}
                </p>
              )}
            </div>
            {clickStatsData.isLoading ? (
              <div className="h-6 w-16 bg-surface-muted rounded animate-pulse"></div>
            ) : (
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${clickStats.clicksPercentChange >= 0 ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"}`}
              >
                {clickStats.clicksPercentChange >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(clickStats.clicksPercentChange)}%
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
            <FaMousePointer className="mr-1" />
            <span>Unique site visitors</span>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm font-medium">
                Conversion Rate
              </h3>
              {clickStatsData.isLoading ? (
                <div className="h-9 w-16 bg-gray-100 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-[var(--foreground)] mt-1">
                  {clickStats.conversionRate}%
                </p>
              )}
            </div>
            {clickStatsData.isLoading ? (
              <div className="h-6 w-16 bg-surface-muted rounded animate-pulse"></div>
            ) : (
              <div
                className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${clickStats.conversionPercentChange >= 0 ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"}`}
              >
                {clickStats.conversionPercentChange >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(clickStats.conversionPercentChange)}%
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
            <FaPercent className="mr-1" />
            <span>Clicks to orders</span>
          </div>
        </div>
      </div>
      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <FaChartLine />
          Revenue & Orders
        </h3>{" "}
        {chartDataQuery.isLoading ? (
          <div className="h-80 w-full bg-surface-muted rounded animate-pulse"></div>
        ) : chartData.length === 0 ? (
          <div className="h-80 w-full flex items-center justify-center text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
            No data available for the selected time range
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
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
                  formatter={() => {
                    return null;
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-admin-card p-3 border border-admin-card-border rounded shadow-sm">
                          <p className="font-medium">
                            {payload[0].payload.time}
                          </p>
                          <p className="text-[#8884d8]">
                            Revenue: $
                            {formatCurrency(
                              Number(payload[0].value || 0),
                            ).replace("$", "")}
                          </p>
                          <p className="text-[#82ca9d]">
                            Orders: {payload[1].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
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
      {/* Latest Completed Orders */}
      <div className="mb-4 md:mb-6">
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <FaShoppingCart />
            Latest Completed Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-start">
              <thead>
                <tr className="border-b border-admin-card-border bg-surface-muted">
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Products
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Price
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Payment Method
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      E-mail
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Time
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-card-border whitespace-nowrap">
                {latestCompletedOrdersData.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-32"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-16"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-24"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-40"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : latestCompletedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-12 text-center text-text-muted"
                    >
                      No completed orders found
                    </td>
                  </tr>
                ) : (
                  latestCompletedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-admin-hover cursor-pointer"
                      onClick={() => router.push(`/admin/invoice/${order.id}`)}
                    >
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {order.products}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center px-2 py-1 bg-success-bg text-success-text text-sm font-medium rounded-md">
                                  {formatCurrency(order.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
                                  <PaymentMethodLogo
                                    paymentType={order.paymentType}
                                    cryptoType={order.cryptoType || undefined}
                                    size="sm"
                                  />
                                  {order.paymentType === PaymentType.CRYPTO &&
                                  order.cryptoType
                                    ? `${order.cryptoType.charAt(0).toUpperCase() + order.cryptoType.slice(1).toLowerCase()}`
                                    : order.paymentType === PaymentType.STRIPE
                                      ? "Stripe"
                                      : order.paymentType === PaymentType.PAYPAL
                                        ? "PayPal"
                                        : order.paymentType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {order.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {formatDistanceToNow(
                                    new Date(order.createdAt),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Top Products and Top Customers */}
      <div className="mb-4 grid grid-cols-1 gap-6 md:mb-6 md:grid-cols-2">
        {/* Top 5 Products */}
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <FaBox />
            Top 5 Products
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-start">
              <thead>
                <tr className="border-b border-admin-card-border bg-surface-muted">
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Product
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Total Sales
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Total Revenue
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-card-border whitespace-nowrap">
                {topProductsData.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-48"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-12"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : topProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-12 text-center text-text-muted"
                    >
                      No product data found
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product, index) => (
                    <tr key={`${product.name}-${index}`}>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {product.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {product.totalSales}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {formatCurrency(product.totalRevenue)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Customers */}
        <div className="bg-admin-card p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <FaUser />
            Top 5 Customers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-start">
              <thead>
                <tr className="border-b border-admin-card-border bg-surface-muted">
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Customer Email
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Total Orders
                    </span>
                  </th>
                  <th className="px-3 py-3.5 text-left">
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Total Spent
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-card-border whitespace-nowrap">
                {topCustomersData.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-40"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-12"></div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-surface-muted rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : topCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-12 text-center text-text-muted"
                    >
                      No customer data found
                    </td>
                  </tr>
                ) : (
                  topCustomers.map((customer) => (
                    <tr key={customer.email}>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {customer.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {customer.totalOrders}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-0 first-of-type:ps-1 last-of-type:pe-1 sm:first-of-type:ps-3 sm:last-of-type:pe-3">
                        <div className="grid w-full gap-y-1 px-3 py-4">
                          <div className="flex">
                            <div className="flex max-w-max">
                              <div className="inline-flex items-center gap-1.5">
                                <span className="text-sm text-[var(--foreground)]">
                                  {formatCurrency(customer.totalSpent)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Crypto Balances Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <FaBitcoin />
          Crypto Balances
        </h3>

        {cryptoBalances.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface-muted p-4 rounded-lg animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Bitcoin */}
            <div className="bg-[#f7931a0d] p-4 rounded-lg border border-[#f7931a33]">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <FaBitcoin className="text-[#f7931a]" />
                  <span className="font-medium">Bitcoin</span>
                </div>
              </div>
              <p className="text-2xl font-bold mb-3">
                {formatCryptoBalance(cryptoBalances.data?.bitcoin || 0)} BTC{" "}
                <span className="text-base font-normal text-gray-500">
                  (${(cryptoBalances.data?.usdValues?.bitcoin || 0).toFixed(2)})
                </span>
              </p>
              <button
                onClick={() => handleOpenWithdraw(CryptoType.BITCOIN)}
                className="w-full py-2 bg-[#f7931a] text-white rounded-md hover:bg-[#e27b0e] transition-colors"
              >
                Withdraw
              </button>
            </div>

            {/* Ethereum */}
            <div className="bg-[#62688f0d] p-4 rounded-lg border border-[#62688f33]">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <FaEthereum className="text-[#62688f]" />
                  <span className="font-medium">Ethereum</span>
                </div>
              </div>
              <p className="text-2xl font-bold mb-3">
                {formatCryptoBalance(cryptoBalances.data?.ethereum || 0)} ETH{" "}
                <span className="text-base font-normal text-gray-500">
                  (${(cryptoBalances.data?.usdValues?.ethereum || 0).toFixed(2)}
                  )
                </span>
              </p>
              <button
                onClick={() => handleOpenWithdraw(CryptoType.ETHEREUM)}
                className="w-full py-2 bg-[#62688f] text-white rounded-md hover:bg-[#4e526f] transition-colors"
              >
                Withdraw
              </button>
            </div>

            {/* Litecoin */}
            <div className="bg-[#345d9d0d] p-4 rounded-lg border border-[#345d9d33]">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <SiLitecoin className="text-[#345d9d]" />
                  <span className="font-medium">Litecoin</span>
                </div>
              </div>
              <p className="text-2xl font-bold mb-3">
                {formatCryptoBalance(cryptoBalances.data?.litecoin || 0)} LTC{" "}
                <span className="text-base font-normal text-gray-500">
                  (${(cryptoBalances.data?.usdValues?.litecoin || 0).toFixed(2)}
                  )
                </span>
              </p>
              <button
                onClick={() => handleOpenWithdraw(CryptoType.LITECOIN)}
                className="w-full py-2 bg-[#345d9d] text-white rounded-md hover:bg-[#264980] transition-colors"
              >
                Withdraw
              </button>
            </div>

            {/* Solana */}
            <div className="bg-[#14f1950d] p-4 rounded-lg border border-[#14f19533]">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <SiSolana className="text-[#14f195]" />
                  <span className="font-medium">Solana</span>
                </div>
              </div>
              <p className="text-2xl font-bold mb-3">
                {formatCryptoBalance(cryptoBalances.data?.solana || 0)} SOL{" "}
                <span className="text-base font-normal text-gray-500">
                  (${(cryptoBalances.data?.usdValues?.solana || 0).toFixed(2)})
                </span>
              </p>
              <button
                onClick={() => handleOpenWithdraw(CryptoType.SOLANA)}
                className="w-full py-2 bg-[#14f195] text-white rounded-md hover:bg-[#0dd07e] transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Withdrawal Dialog */}
      {isWithdrawDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {selectedCrypto === CryptoType.BITCOIN && (
                <FaBitcoin className="text-[#f7931a]" />
              )}
              {selectedCrypto === CryptoType.ETHEREUM && (
                <FaEthereum className="text-[#62688f]" />
              )}
              {selectedCrypto === CryptoType.LITECOIN && (
                <SiLitecoin className="text-[#345d9d]" />
              )}
              {selectedCrypto === CryptoType.SOLANA && (
                <SiSolana className="text-[#14f195]" />
              )}
              Withdraw {selectedCrypto?.toLowerCase()}
            </h3>

            <div className="mb-4">
              <label
                htmlFor="destination"
                className="block text-sm font-medium mb-1 text-[color-mix(in_srgb,var(--foreground),#888_40%)]"
              >
                Destination Address
              </label>
              <input
                id="destination"
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full p-2 border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded"
                placeholder="Enter destination address"
              />
            </div>

            {withdrawalError && (
              <div className="mb-4 text-red-500 text-sm">{withdrawalError}</div>
            )}

            <div className="text-sm mb-4 p-2 bg-gray-50 rounded">
              <p className="font-medium mb-1">Withdrawal Details:</p>
              <p>
                Amount:{" "}
                {selectedCrypto === CryptoType.BITCOIN &&
                  formatCryptoBalance(cryptoBalances.data?.bitcoin || 0) +
                    " BTC"}
                {selectedCrypto === CryptoType.ETHEREUM &&
                  formatCryptoBalance(cryptoBalances.data?.ethereum || 0) +
                    " ETH"}
                {selectedCrypto === CryptoType.LITECOIN &&
                  formatCryptoBalance(cryptoBalances.data?.litecoin || 0) +
                    " LTC"}
                {selectedCrypto === CryptoType.SOLANA &&
                  formatCryptoBalance(cryptoBalances.data?.solana || 0) +
                    " SOL"}
              </p>
              <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                Network fees will be deducted automatically
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsWithdrawDialogOpen(false)}
                className="px-4 py-2 border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={sendBalanceMutation.isPending}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded disabled:opacity-50"
              >
                {sendBalanceMutation.isPending ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useTRPC } from "@/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  FaBitcoin,
  FaEthereum,
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
import { CryptoType } from "@generated";

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

  const cryptoBalances = useQuery(
    trpc.crypto.getCryptoBalance.queryOptions()
  );

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

  // Add the mutation for sending crypto balance
  const sendBalanceMutation = useMutation(trpc.crypto.sendBalance.mutationOptions({
    onSuccess: () => {
      setIsWithdrawDialogOpen(false);
      setDestinationAddress("");
      cryptoBalances.refetch(); // Refresh balances after withdrawal
    },
    onError: (error) => {
      setWithdrawalError(error.message || "Failed to send funds. Please try again.");
    },
  }));

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
              <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
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
                {formatCryptoBalance(cryptoBalances.data?.bitcoin || 0)} BTC
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
                {formatCryptoBalance(cryptoBalances.data?.ethereum || 0)} ETH
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
                {formatCryptoBalance(cryptoBalances.data?.litecoin || 0)} LTC
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
                {formatCryptoBalance(cryptoBalances.data?.solana || 0)} SOL
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
                  formatter={() => {
                    return null;
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                          <p className="font-medium">{payload[0].payload.time}</p>
                          <p className="text-[#8884d8]">Revenue: ${formatCurrency(Number(payload[0].value || 0)).replace('$', '')}</p>
                          <p className="text-[#82ca9d]">Orders: {payload[1].value}</p>
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
            <div className="hidden md:grid md:grid-cols-4 gap-4 px-4 py-2 mb-2 font-medium text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
              <div>Order Info</div>
              <div>Customer</div>
              <div>Items</div>
              <div className="text-right">Total</div>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="
                    cursor-pointer
                    bg-gray-50 hover:bg-gray-100
                    transition-colors duration-150
                    rounded-lg p-4"
                  onClick={() => router.push(`/admin/invoice/${order.id}`)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-start gap-3">
                      <div className="bg-[var(--primary)] bg-opacity-10 rounded-full p-2">
                        <FaShoppingCart className="text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          Order #{order.id}
                        </p>
                        <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                          {format(parseISO(order.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-gray-200 rounded-full p-2">
                        <FaUser className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {order.customer}
                        </p>
                        <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                          Customer
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-gray-200 rounded-full p-2">
                        <FaBox className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {order.items}
                        </p>
                        <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                          Items
                        </p>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-lg font-semibold text-[var(--primary)]">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Dialog */}
      {isWithdrawDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {selectedCrypto === CryptoType.BITCOIN && <FaBitcoin className="text-[#f7931a]" />}
              {selectedCrypto === CryptoType.ETHEREUM && <FaEthereum className="text-[#62688f]" />}
              {selectedCrypto === CryptoType.LITECOIN && <SiLitecoin className="text-[#345d9d]" />}
              {selectedCrypto === CryptoType.SOLANA && <SiSolana className="text-[#14f195]" />}
              Withdraw {selectedCrypto?.toLowerCase()}
            </h3>

            <div className="mb-4">
              <label htmlFor="destination" className="block text-sm font-medium mb-1 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
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
                Amount: {selectedCrypto === CryptoType.BITCOIN && formatCryptoBalance(cryptoBalances.data?.bitcoin || 0) + " BTC"}
                {selectedCrypto === CryptoType.ETHEREUM && formatCryptoBalance(cryptoBalances.data?.ethereum || 0) + " ETH"}
                {selectedCrypto === CryptoType.LITECOIN && formatCryptoBalance(cryptoBalances.data?.litecoin || 0) + " LTC"}
                {selectedCrypto === CryptoType.SOLANA && formatCryptoBalance(cryptoBalances.data?.solana || 0) + " SOL"}
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

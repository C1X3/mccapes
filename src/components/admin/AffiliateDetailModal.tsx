import { useTRPC } from "@/server/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FaTimes,
  FaMousePointer,
  FaShoppingCart,
  FaDollarSign,
  FaChartLine,
  FaPercentage,
  FaCopy,
  FaLink,
  FaEdit,
  FaTrash,
  FaCalendarDay,
  FaToggleOn,
  FaToggleOff,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface AffiliateDetailModalProps {
  affiliateId: string;
  onClose: () => void;
  onEdit: (affiliate: {
    id: string;
    code: string;
    name: string;
    active: boolean;
  }) => void;
  onDeleted: () => void;
}

export default function AffiliateDetailModal({
  affiliateId,
  onClose,
  onEdit,
  onDeleted,
}: AffiliateDetailModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: affiliate, isLoading } = useQuery(
    trpc.affiliate.getById.queryOptions({ id: affiliateId }),
  );

  const deleteMutation = useMutation(
    trpc.affiliate.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Affiliate deleted successfully!");
        onDeleted();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete affiliate");
      },
    }),
  );

  const toggleActiveMutation = useMutation(
    trpc.affiliate.update.mutationOptions({
      onSuccess: () => {
        toast.success(
          affiliate?.active ? "Affiliate deactivated" : "Affiliate activated",
        );
        queryClient.invalidateQueries({
          queryKey: trpc.affiliate.getById.queryKey({ id: affiliateId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.affiliate.getAll.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update affiliate");
      },
    }),
  );

  const handleDelete = () => {
    deleteMutation.mutate({ id: affiliateId });
    setShowDeleteConfirm(false);
  };

  const handleToggleActive = () => {
    if (!affiliate) return;
    toggleActiveMutation.mutate({ id: affiliateId, active: !affiliate.active });
  };

  const copyAffiliateLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/${affiliate.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Affiliate link copied!");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatFullDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!affiliate && !isLoading) return null;

  const clicksChartData =
    affiliate?.clicksLast7Days.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      clicks: d.clicks,
    })) || [];

  const revenueChartData =
    affiliate?.ordersLast7Days.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: d.revenue,
      orders: d.orders,
    })) || [];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--background)] rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : affiliate ? (
          <>
            {/* Header */}
            <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {affiliate.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-[color-mix(in_srgb,var(--background),#333_10%)] px-2 py-0.5 rounded text-[var(--foreground)]">
                      /{affiliate.code}
                    </code>
                    <button
                      onClick={copyAffiliateLink}
                      className="p-1 hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] rounded transition-colors"
                      title="Copy link"
                    >
                      <FaCopy
                        size={12}
                        className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]"
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleToggleActive}
                      disabled={toggleActiveMutation.isPending}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        affiliate.active
                          ? "bg-success-bg text-success-text hover:bg-success"
                          : "bg-error-bg text-error-text hover:bg-error"
                      } disabled:opacity-50`}
                    >
                      {affiliate.active ? (
                        <FaToggleOn size={16} />
                      ) : (
                        <FaToggleOff size={16} />
                      )}
                      {affiliate.active ? "Active" : "Inactive"}
                    </button>
                    <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_50%)]">
                      Click to {affiliate.active ? "deactivate" : "activate"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] rounded-full transition-colors"
                >
                  <FaTimes
                    size={18}
                    className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]"
                  />
                </button>
              </div>

              {/* Today's Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-[color-mix(in_srgb,var(--background),#333_10%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarDay
                      size={14}
                      className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]"
                    />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Today&apos;s Clicks
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {affiliate.clicksToday}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_10%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-1">
                    <FaShoppingCart
                      size={14}
                      className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]"
                    />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Today&apos;s Orders
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {affiliate.ordersToday}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_10%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-1">
                    <FaDollarSign
                      size={14}
                      className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]"
                    />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Today&apos;s Revenue
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {formatCurrency(affiliate.revenueToday)}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              {/* All-time Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-4 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMousePointer className="text-blue-500" size={14} />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Total Clicks
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {affiliate.totalClicks.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-4 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-2">
                    <FaShoppingCart className="text-green-500" size={14} />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Total Orders
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {affiliate.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-4 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-2">
                    <FaDollarSign className="text-amber-500" size={14} />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Total Revenue
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {formatCurrency(affiliate.totalRevenue)}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-4 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-2">
                    <FaChartLine className="text-purple-500" size={14} />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Avg. Order
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {formatCurrency(affiliate.averageOrderValue)}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-4 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <div className="flex items-center gap-2 mb-2">
                    <FaPercentage className="text-pink-500" size={14} />
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                      Conv. Rate
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {affiliate.conversionRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Clicks Chart */}
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-5 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <FaMousePointer className="text-blue-500" />
                    Clicks
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={clicksChartData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="clicksGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(0,0,0,0.1)"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="var(--foreground)"
                          style={{ fontSize: "10px" }}
                          tick={{ fill: "var(--foreground)" }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="var(--foreground)"
                          style={{ fontSize: "10px" }}
                          tick={{ fill: "var(--foreground)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--admin-card)",
                            borderColor: "var(--admin-card-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number | undefined) => [
                            value ?? 0,
                            "Clicks",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#clicksGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-5 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <FaDollarSign className="text-amber-500" />
                    Revenue
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueChartData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="revenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f59e0b"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f59e0b"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(0,0,0,0.1)"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="var(--foreground)"
                          style={{ fontSize: "10px" }}
                          tick={{ fill: "var(--foreground)" }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          stroke="var(--foreground)"
                          style={{ fontSize: "10px" }}
                          tick={{ fill: "var(--foreground)" }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--admin-card)",
                            borderColor: "var(--admin-card-border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number | undefined) => [
                            formatCurrency(value ?? 0),
                            "Revenue",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fill="url(#revenueGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-5 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <FaShoppingCart className="text-green-500" />
                  Recent Orders
                </h3>
                {affiliate.recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
                          <th className="text-left py-4 px-2 text-[var(--foreground)]">
                            Products
                          </th>
                          <th className="text-left py-4 px-2 text-[var(--foreground)]">
                            Price
                          </th>
                          <th className="text-left py-4 px-2 text-[var(--foreground)]">
                            E-mail
                          </th>
                          <th className="text-left py-4 px-2 text-[var(--foreground)]">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {affiliate.recentOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] hover:bg-[color-mix(in_srgb,var(--background),#333_5%)] cursor-pointer"
                            onClick={() =>
                              router.push(`/admin/invoice/${order.id}`)
                            }
                          >
                            <td className="py-4 px-2 text-[var(--foreground)]">
                              {order.products}
                            </td>
                            <td className="py-4 px-2">
                              <span className="inline-flex items-center px-2 py-1 bg-success-bg text-success-text text-sm font-medium rounded-md">
                                {formatCurrency(order.totalPrice)}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-[var(--foreground)]">
                              {order.customerEmail}
                            </td>
                            <td className="py-4 px-2 text-[var(--foreground)]">
                              {formatDistanceToNow(new Date(order.createdAt), {
                                addSuffix: true,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-[color-mix(in_srgb,var(--foreground),#888_40%)] py-8">
                    No orders from this affiliate yet
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] p-4 flex items-center justify-between bg-[color-mix(in_srgb,var(--background),#333_5%)]">
              <div className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                Created: {formatFullDate(affiliate.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAffiliateLink}
                  className="px-4 py-2 bg-[color-mix(in_srgb,var(--background),#333_10%)] text-[var(--foreground)] rounded-lg hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors flex items-center gap-2"
                >
                  <FaLink size={14} />
                  Copy Link
                </button>
                <button
                  onClick={() => onEdit(affiliate)}
                  className="px-4 py-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2"
                >
                  <FaEdit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-error-bg text-error-text rounded-lg hover:bg-error transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FaTrash size={14} />
                  Delete
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-[var(--background)] rounded-xl p-6 max-w-md w-full shadow-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-error-bg flex items-center justify-center flex-shrink-0">
                <FaExclamationTriangle className="text-error-text" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Delete Affiliate
                </h3>
                <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-[var(--foreground)] mb-6">
              Are you sure you want to delete <strong>{affiliate?.name}</strong>
              ? This will permanently delete the affiliate and all associated
              click tracking data.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[color-mix(in_srgb,var(--background),#333_10%)] text-[var(--foreground)] rounded-lg hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-text transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FaTrash size={14} />
                {deleteMutation.isPending ? "Deleting..." : "Delete Affiliate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

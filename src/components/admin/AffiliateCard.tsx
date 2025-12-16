import { FaMousePointer, FaShoppingCart, FaDollarSign, FaChartLine, FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";

interface AffiliateCardProps {
  affiliate: {
    id: string;
    code: string;
    name: string;
    active: boolean;
    totalClicks: number;
    totalOrders: number;
    totalRevenue: number;
    conversionRate: number;
    clicksLast7Days: { date: string; clicks: number }[];
  };
  onClick: () => void;
}

export default function AffiliateCard({ affiliate, onClick }: AffiliateCardProps) {
  const maxClicks = Math.max(...affiliate.clicksLast7Days.map((d) => d.clicks), 1);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const todaysClicks = affiliate.clicksLast7Days[affiliate.clicksLast7Days.length - 1]?.clicks || 0;

  const copyAffiliateLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Affiliate link copied!");
  };

  return (
    <div
      onClick={onClick}
      className="bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg p-6 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] cursor-pointer hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{affiliate.name}</h3>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_50%)]">
              ?ref={affiliate.code}
            </p>
            <button
              onClick={copyAffiliateLink}
              className="p-1 hover:bg-[color-mix(in_srgb,var(--background),#333_20%)] rounded transition-colors"
              title="Copy affiliate link"
            >
              <FaCopy size={11} className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              affiliate.active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {affiliate.active ? "Active" : "Inactive"}
          </span>
          {todaysClicks > 0 && (
            <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_50%)]">
              {todaysClicks} click{todaysClicks !== 1 ? 's' : ''} today
            </span>
          )}
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <FaChartLine className="text-[var(--primary)]" size={12} />
          <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_50%)]">
            Clicks (Last 7 days)
          </span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {affiliate.clicksLast7Days.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-[var(--primary)] rounded-t-sm min-h-[4px] transition-all"
                style={{ height: `${Math.max((day.clicks / maxClicks) * 100, 8)}%` }}
              />
              <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground),#888_60%)]">
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[color-mix(in_srgb,var(--background),#333_18%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaMousePointer className="text-blue-500" size={12} />
            <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_50%)]">Clicks</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {affiliate.totalClicks.toLocaleString()}
          </p>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--background),#333_18%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaShoppingCart className="text-green-500" size={12} />
            <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_50%)]">Orders</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {affiliate.totalOrders.toLocaleString()}
          </p>
        </div>
        <div className="bg-[color-mix(in_srgb,var(--background),#333_18%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-amber-500" size={12} />
            <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_50%)]">Revenue</span>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {formatCurrency(affiliate.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Conversion Rate Footer */}
      <div className="mt-4 pt-4 border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[color-mix(in_srgb,var(--foreground),#888_50%)]">
            Conversion Rate
          </span>
          <span className={`text-sm font-semibold ${
            affiliate.conversionRate >= 5 ? "text-green-500" : 
            affiliate.conversionRate >= 2 ? "text-amber-500" : "text-[var(--foreground)]"
          }`}>
            {affiliate.conversionRate.toFixed(2)}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-[color-mix(in_srgb,var(--background),#333_20%)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              affiliate.conversionRate >= 5 ? "bg-green-500" : 
              affiliate.conversionRate >= 2 ? "bg-amber-500" : 
              "bg-[var(--primary)]"
            }`}
            style={{ width: `${Math.min(affiliate.conversionRate * 10, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

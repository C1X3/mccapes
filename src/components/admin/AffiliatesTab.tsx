import { useTRPC } from "@/server/client";
import { useState } from "react";
import { FaPlus, FaUsers } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import AffiliateFormModal from "./AffiliateFormModal";
import AffiliateDetailModal from "./AffiliateDetailModal";
import AffiliateCard from "./AffiliateCard";

interface Affiliate {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  clicksLast7Days: { date: string; clicks: number }[];
  ordersLast7Days: { date: string; orders: number; revenue: number }[];
}

export default function AffiliatesTab() {
  const trpc = useTRPC();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(
    null,
  );
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(
    null,
  );

  const {
    data: affiliates = [],
    isLoading,
    refetch: refetchAffiliates,
  } = useQuery(trpc.affiliate.getAll.queryOptions());

  const handleCardClick = (affiliateId: string) => {
    setSelectedAffiliateId(affiliateId);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--color-admin-card)] p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <FaUsers />
            Affiliates
          </h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
          >
            <FaPlus size={14} />
            <span>Add Affiliate</span>
          </button>
        </div>

        {/* Stats Overview */}
        {!isLoading &&
          affiliates.length > 0 &&
          (() => {
            const totalClicks = affiliates.reduce(
              (sum, a) => sum + a.totalClicks,
              0,
            );
            const totalOrders = affiliates.reduce(
              (sum, a) => sum + a.totalOrders,
              0,
            );
            const overallConversionRate =
              totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
                  <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
                    Conversion Rate
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      overallConversionRate >= 5
                        ? "text-success"
                        : overallConversionRate >= 2
                          ? "text-warning"
                          : "text-[var(--foreground)]"
                    }`}
                  >
                    {overallConversionRate.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
                  <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
                    Total Clicks
                  </h3>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {totalClicks.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
                  <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
                    Total Orders
                  </h3>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-4 rounded-lg border border-[var(--border)]">
                  <h3 className="text-[var(--color-text-secondary)] text-sm mb-1">
                    Total Revenue
                  </h3>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    $
                    {affiliates
                      .reduce((sum, a) => sum + a.totalRevenue, 0)
                      .toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </p>
                </div>
              </div>
            );
          })()}

        {/* Affiliate Cards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : affiliates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {affiliates.map((affiliate) => (
              <AffiliateCard
                key={affiliate.id}
                affiliate={affiliate}
                onClick={() => handleCardClick(affiliate.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[color-mix(in_srgb,var(--surface),#000_6%)] rounded-lg p-12 text-center border border-[var(--border)]">
            <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--surface),#000_10%)] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers
                className="text-[color-mix(in_srgb,var(--foreground),#888_50%)]"
                size={24}
              />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No affiliates yet
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Create your first affiliate to start tracking referrals
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
            >
              Add Your First Affiliate
            </button>
          </div>
        )}

        {/* Modals */}
        {isAddModalOpen && (
          <AffiliateFormModal
            isOpen={isAddModalOpen}
            onCloseAction={() => setIsAddModalOpen(false)}
            onSuccess={() => refetchAffiliates()}
          />
        )}

        {editingAffiliate && (
          <AffiliateFormModal
            isOpen={!!editingAffiliate}
            onCloseAction={() => setEditingAffiliate(null)}
            initialData={editingAffiliate}
            isEditing={true}
            onSuccess={() => refetchAffiliates()}
          />
        )}

        {selectedAffiliateId && (
          <AffiliateDetailModal
            affiliateId={selectedAffiliateId}
            onClose={() => setSelectedAffiliateId(null)}
            onEdit={(affiliate: {
              id: string;
              code: string;
              name: string;
              active: boolean;
            }) => {
              setSelectedAffiliateId(null);
              setEditingAffiliate(affiliate as Affiliate);
            }}
            onDeleted={() => {
              setSelectedAffiliateId(null);
              refetchAffiliates();
            }}
          />
        )}
      </div>
    </div>
  );
}

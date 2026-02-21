import { useTRPC } from "@/server/client";
import { useState } from "react";
import { FaEdit, FaPlus, FaTicketAlt, FaTrash } from "react-icons/fa";

// Import the actual CouponFormModal component
import { Coupon } from "@generated/browser";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CouponFormModal from "./CouponFormModal";

export default function CouponsTab() {
  const trpc = useTRPC();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Query to fetch coupons
  const {
    data: coupons = [],
    isLoading,
    refetch: refetchCoupons,
  } = useQuery(trpc.coupon.getAll.queryOptions());

  // Delete coupon mutation
  const deleteCouponMutation = useMutation(
    trpc.coupon.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Coupon deleted successfully!");
        refetchCoupons();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete coupon");
      },
    }),
  );

  const handleDeleteCoupon = (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      deleteCouponMutation.mutate({ id });
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditModalOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--color-admin-card)] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <FaTicketAlt />
          Coupons
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
        >
          <FaPlus size={14} />
          <span>Add Coupon</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Code
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Discount
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Valid Until
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Usage
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Status
              </th>
              <th className="text-right py-4 px-2 text-[var(--foreground)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {" "}
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-[var(--color-text-secondary)]"
                >
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length > 0 ? (
              coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)]"
                >
                  <td className="py-4 px-2 text-[var(--foreground)] font-medium">
                    {coupon.code}
                  </td>
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {coupon.discount}
                    {coupon.type === "PERCENTAGE" ? "%" : "$"}{" "}
                    {coupon.type === "PERCENTAGE" ? "off" : ""}
                  </td>
                  <td className="py-4 px-2 text-[var(--color-text-secondary)]">
                    {formatDate(coupon.validUntil.toString())}
                  </td>
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {coupon.usageCount}/{coupon.usageLimit}
                  </td>
                  <td className="py-4 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        !coupon.active
                          ? "bg-error-bg text-error-text"
                          : coupon.usageCount >= coupon.usageLimit
                            ? "bg-warning-bg text-warning-text"
                            : new Date(coupon.validUntil) < new Date()
                              ? "bg-surface-muted text-[var(--color-text-secondary)]"
                              : "bg-success-bg text-success-text"
                      }`}
                    >
                      {!coupon.active
                        ? "Inactive"
                        : coupon.usageCount >= coupon.usageLimit
                          ? "Max Uses Reached"
                          : new Date(coupon.validUntil) < new Date()
                            ? "Expired"
                            : "Active"}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className="p-2 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors"
                        title="Edit Coupon"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 bg-error-bg text-error-text rounded hover:bg-error transition-colors"
                        title="Delete Coupon"
                        disabled={deleteCouponMutation.isPending}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-[var(--border)] text-center">
                <td
                  colSpan={6}
                  className="py-12 text-[var(--color-text-secondary)]"
                >
                  No coupons found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>{" "}
      {/* Coupon Form Modals */}
      {isAddModalOpen && (
        <CouponFormModal
          isOpen={isAddModalOpen}
          onCloseAction={() => setIsAddModalOpen(false)}
          onSuccess={() => refetchCoupons()}
        />
      )}
      {isEditModalOpen && selectedCoupon && (
        <CouponFormModal
          isOpen={isEditModalOpen}
          onCloseAction={() => {
            setIsEditModalOpen(false);
            setSelectedCoupon(null);
          }}
          initialData={{
            ...selectedCoupon,
            validUntil: new Date(selectedCoupon.validUntil)
              .toISOString()
              .split("T")[0],
          }}
          isEditing={true}
          onSuccess={() => refetchCoupons()}
        />
      )}
    </div>
  );
}

"use client";

import { useTRPC } from "@/server/client";
import { couponCodeSchema } from "@/server/schemas/coupon";
import { CouponType } from "@generated/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Controller, Resolver, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { z } from "zod";

export type CouponFormModalSchema = z.infer<typeof couponCodeSchema>;

type CouponFormModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  initialData?: CouponFormModalSchema;
  isEditing?: boolean;
  onSuccess?: () => void;
};

export default function CouponFormModal({
  isOpen,
  onCloseAction,
  initialData,
  isEditing = false,
  onSuccess,
}: CouponFormModalProps) {
  const trpc = useTRPC();

  const { control, handleSubmit, reset } = useForm<CouponFormModalSchema>({
    resolver: zodResolver(couponCodeSchema) as Resolver<CouponFormModalSchema>,
    defaultValues: initialData ?? {
      code: "",
      discount: 0,
      type: CouponType.PERCENTAGE,
      validUntil: new Date().toISOString().split("T")[0],
      usageLimit: 100,
      active: true,
    },
  });

  const createCoupon = useMutation(
    trpc.coupon.create.mutationOptions({
      onSuccess: () => {
        toast.success("Coupon created successfully!");
        reset();
        onCloseAction();
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create coupon");
      },
    }),
  );

  const updateCoupon = useMutation(
    trpc.coupon.update.mutationOptions({
      onSuccess: () => {
        toast.success("Coupon updated successfully!");
        reset();
        onCloseAction();
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update coupon");
      },
    }),
  );

  const onSubmit = (data: CouponFormModalSchema) => {
    if (isEditing && initialData?.id) {
      updateCoupon.mutate({
        id: initialData.id,
        ...data,
      });
    } else {
      createCoupon.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--color-admin-card)] rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            {isEditing ? "Edit Coupon" : "Add New Coupon"}
          </h2>{" "}
          <button
            onClick={onCloseAction}
            className="p-2 text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface),#000_8%)] rounded-full transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Coupon Code */}
          <div className="mb-4">
            <label
              htmlFor="code"
              className="block text-[var(--foreground)] mb-2"
            >
              Coupon Code *
            </label>
            <Controller
              name="code"
              control={control}
              rules={{ required: "Coupon code is required" }}
              render={({ field, fieldState }) => (
                <>
                  <input
                    id="code"
                    type="text"
                    {...field}
                    className="w-full p-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[var(--border)]"
                    placeholder="e.g., SUMMER20"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Discount Amount and Type */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="discount"
                className="block text-[var(--foreground)] mb-2"
              >
                Discount Amount *
              </label>
              <Controller
                name="discount"
                control={control}
                rules={{ required: "Discount amount is required" }}
                render={({ field, fieldState }) => (
                  <>
                    <input
                      id="discount"
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className="w-full p-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[var(--border)]"
                      placeholder="Enter discount amount"
                    />
                    {fieldState.error && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label
                htmlFor="type"
                className="block text-[var(--foreground)] mb-2"
              >
                Discount Type *
              </label>
              <Controller
                name="type"
                control={control}
                rules={{ required: "Discount type is required" }}
                render={({ field, fieldState }) => (
                  <>
                    <select
                      id="type"
                      className="w-full p-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[var(--border)]"
                      {...field}
                      // onChange={(e) => {
                      //   console.log(e.target.value);
                      //   field.onChange(e.target.value === "PERCENTAGE" ? CouponType.PERCENTAGE : CouponType.FIXED);
                      // }}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                    {fieldState.error && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          {/* Valid Until Date */}
          <div className="mb-4">
            <label
              htmlFor="validUntil"
              className="block text-[var(--foreground)] mb-2"
            >
              Valid Until *
            </label>
            <Controller
              name="validUntil"
              control={control}
              rules={{ required: "Valid until date is required" }}
              render={({ field, fieldState }) => (
                <>
                  <input
                    id="validUntil"
                    type="date"
                    {...field}
                    className="w-full p-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[var(--border)]"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Usage Limit */}
          <div className="mb-4">
            <label
              htmlFor="usageLimit"
              className="block text-[var(--foreground)] mb-2"
            >
              Usage Limit *
            </label>
            <Controller
              name="usageLimit"
              control={control}
              rules={{ required: "Usage limit is required" }}
              render={({ field, fieldState }) => (
                <>
                  <input
                    id="usageLimit"
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    className="w-full p-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[var(--border)]"
                    placeholder="Enter usage limit"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Active Status */}
          <div className="flex flex-col mb-6">
            <label className="flex items-center gap-2 text-[var(--foreground)] cursor-pointer">
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-5 h-5 rounded border-[var(--border)] focus:ring-[var(--primary)]"
                  />
                )}
              />
              <span>Active</span>
            </label>
            <span className="text-sm text-[var(--color-text-secondary)] mt-1 ml-7">
              Enable or disable this coupon
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCloseAction}
              className="px-6 py-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--surface),#000_18%)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
              disabled={createCoupon.isPending || updateCoupon.isPending}
            >
              {createCoupon.isPending || updateCoupon.isPending
                ? "Saving..."
                : isEditing
                  ? "Update Coupon"
                  : "Add Coupon"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

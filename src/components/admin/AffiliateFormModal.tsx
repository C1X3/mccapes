import { useTRPC } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { FaTimes, FaUsers } from "react-icons/fa";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

interface AffiliateFormData {
  id?: string;
  code: string;
  name: string;
  active: boolean;
}

interface AffiliateFormModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSuccess: () => void;
  initialData?: AffiliateFormData;
  isEditing?: boolean;
}

export default function AffiliateFormModal({
  isOpen,
  onCloseAction,
  onSuccess,
  initialData,
  isEditing = false,
}: AffiliateFormModalProps) {
  const trpc = useTRPC();

  const [formData, setFormData] = useState<AffiliateFormData>({
    code: initialData?.code || "",
    name: initialData?.name || "",
    active: initialData?.active ?? true,
  });

  const createMutation = useMutation(
    trpc.affiliate.create.mutationOptions({
      onSuccess: () => {
        toast.success("Affiliate created successfully!");
        onSuccess();
        onCloseAction();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create affiliate");
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.affiliate.update.mutationOptions({
      onSuccess: () => {
        toast.success("Affiliate updated successfully!");
        onSuccess();
        onCloseAction();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update affiliate");
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--color-admin-card)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-bg rounded-full">
              <FaUsers className="text-info-text" size={20} />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {isEditing ? "Edit Affiliate" : "Add Affiliate"}
            </h2>
          </div>
          <button
            onClick={onCloseAction}
            className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--surface),#000_8%)] transition-colors"
          >
            <FaTimes size={16} className="text-[var(--foreground)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Affiliate Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-3 rounded-lg bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)]"
              placeholder="John Doe"
              required
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              The name of the affiliate or sponsorship
            </p>
          </div>

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Affiliate Code
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, ""),
                })
              }
              className="w-full p-3 rounded-lg bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)]"
              placeholder="johndoe"
              required
              pattern="[a-zA-Z0-9_-]+"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              This will be used in the URL: mccapes.net/
              <strong>{formData.code || "code"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="w-4 h-4 rounded bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)]"
            />
            <label
              htmlFor="active"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCloseAction}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--primary)] text-white hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update Affiliate"
                  : "Create Affiliate"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

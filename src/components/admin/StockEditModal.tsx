"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaBox } from "react-icons/fa";
import { Product } from "@generated/browser";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/server/client";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

interface StockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess: () => void;
}

export default function StockEditModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockEditModalProps) {
  const trpc = useTRPC();
  const [stockText, setStockText] = useState("");

  useEffect(() => {
    if (product && isOpen) {
      setStockText(product.stock.join("\n"));
    }
  }, [product, isOpen]);

  const updateStockMutation = useMutation(
    trpc.product.updateStock.mutationOptions({
      onSuccess: () => {
        toast.success("Stock updated successfully");
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(`Error updating stock: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Split by newlines and filter out empty lines
    const stockArray = stockText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    updateStockMutation.mutate({
      id: product.id,
      stock: stockArray,
    });
  };

  if (!isOpen) return null;

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--color-admin-card)] rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <FaBox />
            Edit Stock: {product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-2 rounded-lg transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-[var(--foreground)] mb-2">
              Stock Codes (one per line)
            </label>
            <textarea
              value={stockText}
              onChange={(e) => setStockText(e.target.value)}
              className="w-full p-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono text-sm"
              placeholder="Enter stock codes, one per line"
              rows={15}
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Current stock count:{" "}
              {stockText
                .split("\n")
                .filter((line) => line.trim().length > 0).length}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-transparent border border-[var(--border)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStockMutation.isPending}
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors disabled:opacity-50"
            >
              {updateStockMutation.isPending ? "Saving..." : "Save Stock"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

import React from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { OrderStatus, PaymentType } from "@generated";
import { getPaymentMethodName } from "@/utils/invoiceUtils";

interface InvoiceFilterModalProps {
  showFilterModal: boolean;
  tempStatusFilter: OrderStatus | "ALL";
  tempEmailFilter: string;
  tempProductFilter: string;
  tempCouponFilter: string;
  tempPaymentFilter: PaymentType | "ALL";
  tempDiscordFilter: string;
  tempCodeFilter: string;
  tempPaypalNoteFilter: string;
  tempInvoiceIdFilter: string;
  tempDateProcessedFilter: string;
  setTempInvoiceIdFilter: (value: string) => void;
  setTempStatusFilter: (value: OrderStatus | "ALL") => void;
  setTempEmailFilter: (value: string) => void;
  setTempProductFilter: (value: string) => void;
  setTempCouponFilter: (value: string) => void;
  setTempPaymentFilter: (value: PaymentType | "ALL") => void;
  setTempDiscordFilter: (value: string) => void;
  setTempCodeFilter: (value: string) => void;
  setTempPaypalNoteFilter: (value: string) => void;
  setTempDateProcessedFilter: (value: string) => void;
  onClose: () => void;
  onApplyFilters: () => void;
  onResetAndApplyFilters: () => void;
}

export default function InvoiceFilterModal({
  showFilterModal,
  tempStatusFilter,
  tempEmailFilter,
  tempProductFilter,
  tempCouponFilter,
  tempPaymentFilter,
  tempDiscordFilter,
  tempCodeFilter,
  tempPaypalNoteFilter,
  tempInvoiceIdFilter,
  tempDateProcessedFilter,
  setTempInvoiceIdFilter,
  setTempStatusFilter,
  setTempEmailFilter,
  setTempProductFilter,
  setTempCouponFilter,
  setTempPaymentFilter,
  setTempDiscordFilter,
  setTempCodeFilter,
  setTempPaypalNoteFilter,
  setTempDateProcessedFilter,
  onClose,
  onApplyFilters,
  onResetAndApplyFilters,
}: InvoiceFilterModalProps) {
  if (!showFilterModal) return null;

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
        className="bg-[var(--background)] rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Filter Invoices</h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] rounded-full transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>{" "}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplyFilters();
          }}
        >
          <input type="submit" className="hidden" />          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Row 1: Invoice ID, Status */}
            <div>
              <label htmlFor="invoiceId" className="block text-[var(--foreground)] mb-2">
                Invoice ID
              </label>
              <input
                name="invoiceId"
                type="text"
                id="invoiceId"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxx"
                value={tempInvoiceIdFilter}
                onChange={(e) => setTempInvoiceIdFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-[var(--foreground)] mb-2">
                Status
              </label>
              <select
                id="status"
                value={tempStatusFilter}
                onChange={(e) => setTempStatusFilter(e.target.value as OrderStatus | "ALL")}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] appearance-none"
                style={{ minHeight: '48px' }}
              >
                <option value="ALL">All Statuses</option>
                {Object.values(OrderStatus)
                  .filter((x) => x !== OrderStatus.PAID)
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
            </div>

            {/* Row 2: Email, Payment Method */}
            <div>
              <label htmlFor="email" className="block text-[var(--foreground)] mb-2">
                E-mail Address
              </label>
              <input
                name="email"
                type="text"
                id="email"
                placeholder="customer@website.com"
                value={tempEmailFilter}
                onChange={(e) => setTempEmailFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-[var(--foreground)] mb-2">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={tempPaymentFilter}
                onChange={(e) => setTempPaymentFilter(e.target.value as PaymentType | "ALL")}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] appearance-none"
                style={{ minHeight: '48px' }}
              >
                <option value="ALL">All Payment Methods</option>
                {Object.values(PaymentType).map((method) => (
                  <option key={method} value={method}>
                    {getPaymentMethodName(method)}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Discord, Date Processed */}
            <div>
              <label htmlFor="discord" className="block text-[var(--foreground)] mb-2">
                Discord Username
              </label>
              <input
                name="discord"
                type="text"
                id="discord"
                placeholder="Discord Username"
                value={tempDiscordFilter}
                onChange={(e) => setTempDiscordFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-[var(--foreground)] mb-2">
                Date Processed
              </label>
              <input
                name="date"
                type="date"
                id="date"
                value={tempDateProcessedFilter}
                onChange={(e) => setTempDateProcessedFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>

            {/* Row 4: Product Name, PayPal Note */}
            <div>
              <label htmlFor="product" className="block text-[var(--foreground)] mb-2">
                Product Name
              </label>
              <input
                name="product"
                type="text"
                id="product"
                placeholder="Product Name"
                value={tempProductFilter}
                onChange={(e) => setTempProductFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>
            <div>
              <label htmlFor="paypalNote" className="block text-[var(--foreground)] mb-2">
                PayPal Note
              </label>
              <input
                name="paypalNote"
                type="text"
                id="paypalNote"
                placeholder="PayPal Transaction Note"
                value={tempPaypalNoteFilter}
                onChange={(e) => setTempPaypalNoteFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>

            {/* Row 5: Coupon Code, Deliverable Code */}
            <div>
              <label htmlFor="coupon" className="block text-[var(--foreground)] mb-2">
                Coupon Code
              </label>
              <input
                name="coupon"
                type="text"
                id="coupon"
                placeholder="Coupon Code"
                value={tempCouponFilter}
                onChange={(e) => setTempCouponFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-[var(--foreground)] mb-2">
                Deliverable Code
              </label>
              <input
                name="code"
                type="text"
                id="code"
                placeholder="Deliverable Code"
                value={tempCodeFilter}
                onChange={(e) => setTempCodeFilter(e.target.value)}
                className="w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
              />
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onResetAndApplyFilters}
            className="px-6 py-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--background),#333_25%)] transition-colors"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onApplyFilters}
            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

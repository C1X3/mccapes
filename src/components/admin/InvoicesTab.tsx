import React from "react";
import { FaReceipt, FaSearch } from "react-icons/fa";

export default function InvoicesTab() {
  return (
    <div className="bg-[color-mix(in_srgb,var(--background),#333_15%)] p-6 rounded-xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <FaReceipt />
          Invoices
        </h2>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search invoices..."
            className="pl-10 pr-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]" size={14} />
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Total Sales</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">$0.00</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Invoices</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Pending</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Completed</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Invoice ID
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Customer
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Date
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Items
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Total
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] text-center">
              <td colSpan={6} className="py-12 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                No invoices found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 
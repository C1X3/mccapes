import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { FaReceipt, FaSearch, FaDownload, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { OrderStatus } from "@generated";
import { useRouter } from "next/navigation";
import InvoiceFilterModal from "./InvoiceFilterModal";
import { getPaymentMethodName, getStatusBadgeClass, formatDate } from "@/utils/invoiceUtils";
import { exportInvoicesToCSV } from "@/utils/csvExport";
import { useInvoiceFilters } from "@/hooks/useInvoiceFilters";

export default function InvoicesTab() {
  const trpc = useTRPC();
  const router = useRouter();
  
  // Use the custom hook for filter management
  const {
    filters,
    tempFilters,
    setTempStatusFilter,
    setTempPaymentFilter,
    setTempProductFilter,
    setTempEmailFilter,
    setTempDiscordFilter,
    setTempCouponFilter,
    setTempCodeFilter,
    setTempPaypalNoteFilter,
    setTempInvoiceIdFilter,
    setTempDateProcessedFilter,
    initializeTempFilters,
    applyFilters,
    resetFilters,
  } = useInvoiceFilters();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const { data: invoices = [] } = useQuery(trpc.invoices.getAll.queryOptions());
  // Navigate to invoice detail page
  const navigateToInvoice = (invoiceId: string) => {
    router.push(`/admin/invoice/${invoiceId}`);
  };
  // Filter invoices based on all filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // 1) Search‐term filter (unchanged)
      const matchesSearch =
        searchTerm === "" ||
        (invoice.id && invoice.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.status && invoice.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.customer?.email && invoice.customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.customer?.discord && invoice.customer.discord.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.paymentType && invoice.paymentType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.couponUsed && invoice.couponUsed.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.OrderItem &&
          invoice.OrderItem.some((item) =>
        (item.product?.name && item.product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(item.codes) &&
          item.codes.some((code: string) =>
            code && code.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
          )
        );

      // 2) Status filter (updated)
      const matchesStatus = (() => {
        if (filters.statusFilter === "ALL") {
          return true;
        }
        if (filters.statusFilter === OrderStatus.DELIVERED) {
          // when "DELIVERED" is selected, include both PAID and DELIVERED
          return (
            invoice.status === OrderStatus.DELIVERED ||
            invoice.status === OrderStatus.PAID
          );
        }
        // any other status (e.g. "PENDING" or "CANCELLED") must match exactly
        return invoice.status === filters.statusFilter;
      })();

      // 3) Payment‐method filter (unchanged)
      const matchesPayment =
        filters.paymentFilter === "ALL" || invoice.paymentType === filters.paymentFilter;

      // 4) Product‐name filter (unchanged)
      const matchesProduct =
        filters.productFilter === "" ||
        invoice.OrderItem?.some((item) =>
          item.product.name.toLowerCase().includes(filters.productFilter.toLowerCase())
        );

      // 5) Email filter (new)
      const matchesEmail =
        filters.emailFilter === "" || invoice.customer?.email.toLowerCase().includes(filters.emailFilter.toLowerCase());

      // 6) Discord filter (new)
      const matchesDiscord =
        filters.discordFilter === "" || (invoice.customer?.discord && invoice.customer.discord.toLowerCase().includes(filters.discordFilter.toLowerCase()));

      // 7) Coupon filter (new)
      const matchesCoupon =
        filters.couponFilter === "" || invoice.couponUsed?.toLowerCase().includes(filters.couponFilter.toLowerCase());

      // 8) Code filter (new)
      const matchesCode =
        filters.codeFilter === "" ||
        (invoice.OrderItem &&
          invoice.OrderItem.some((item) =>
            Array.isArray(item.codes) &&
            item.codes.some((code: string) =>
              code && code.toLowerCase().includes(filters.codeFilter.toLowerCase())
            )
          )
        );

      // 9) PayPal note filter (new)
      const matchesPaypalNote =
        filters.paypalNoteFilter === "" || (invoice.paypalNote && invoice.paypalNote.toLowerCase().includes(filters.paypalNoteFilter.toLowerCase()));

      // 10) Invoice ID filter (new)
      const matchesInvoiceId =
        filters.invoiceIdFilter === "" || invoice.id?.toLowerCase().includes(filters.invoiceIdFilter.toLowerCase());

      // 11) Date processed filter (new)
      const matchesDateProcessed = !filters.dateProcessedFilter || 
        (invoice.updatedAt && new Date(invoice.updatedAt).toISOString().split('T')[0] === filters.dateProcessedFilter);

      return matchesSearch && matchesStatus && matchesPayment && matchesProduct && 
             matchesEmail && matchesDiscord && matchesCoupon && matchesCode && matchesPaypalNote && matchesInvoiceId && matchesDateProcessed;
    });
  }, [invoices, searchTerm, filters]);

  // Pagination logic
  const totalItems = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is valid
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage);
  }
  
  // Get current page's invoices
  const currentInvoices = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, safeCurrentPage, itemsPerPage]);

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };
  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  // Calculate stats
  const totalSales = filteredInvoices.reduce((sum, invoice) =>
    invoice.status === OrderStatus.PAID || invoice.status === OrderStatus.DELIVERED
      ? sum + invoice.totalPrice
      : sum, 0
  );

  const pendingCount = filteredInvoices.filter(
    (invoice) => invoice.status === OrderStatus.PENDING
  ).length;

  const completedCount = filteredInvoices.filter(
    (invoice) =>
      invoice.status === OrderStatus.PAID ||
      invoice.status === OrderStatus.DELIVERED
  ).length;

  // Initialize the temporary filters with the current filter values
  const openFilterModal = () => {
    initializeTempFilters();
    setShowFilterModal(true);
  };

  // Apply the temporary filters to the actual filters
  const handleApplyFilters = () => {
    applyFilters();
    setShowFilterModal(false);
    // Reset to first page when applying new filters
    setCurrentPage(1);
  };

  // Reset and apply filters (for the reset button in modal)
  const handleResetAndApplyFilters = () => {
    resetFilters();
    setShowFilterModal(false);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[color-mix(in_srgb,var(--background),#333_15%)] p-6 rounded-xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
      <InvoiceFilterModal
        showFilterModal={showFilterModal}
        tempStatusFilter={tempFilters.statusFilter}
        tempEmailFilter={tempFilters.emailFilter}
        tempProductFilter={tempFilters.productFilter}
        tempCouponFilter={tempFilters.couponFilter}
        tempPaymentFilter={tempFilters.paymentFilter}
        tempDiscordFilter={tempFilters.discordFilter}
        tempCodeFilter={tempFilters.codeFilter}
        tempPaypalNoteFilter={tempFilters.paypalNoteFilter}
        tempInvoiceIdFilter={tempFilters.invoiceIdFilter}
        tempDateProcessedFilter={tempFilters.dateProcessedFilter}
        setTempDateProcessedFilter={setTempDateProcessedFilter}
        setTempInvoiceIdFilter={setTempInvoiceIdFilter}
        setTempStatusFilter={setTempStatusFilter}
        setTempEmailFilter={setTempEmailFilter}
        setTempProductFilter={setTempProductFilter}
        setTempCouponFilter={setTempCouponFilter}
        setTempPaymentFilter={setTempPaymentFilter}
        setTempDiscordFilter={setTempDiscordFilter}
        setTempCodeFilter={setTempCodeFilter}
        setTempPaypalNoteFilter={setTempPaypalNoteFilter}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        onResetAndApplyFilters={handleResetAndApplyFilters}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <FaReceipt />
          Invoices
        </h2>        <div className="flex gap-3 items-center flex-wrap">
          {/* Export to CSV button - hidden on mobile */}
          <button
            onClick={() => exportInvoicesToCSV(filteredInvoices)}
            className="hidden md:flex items-center gap-2 p-2 rounded-lg bg-[color-mix(in_srgb,var(--primary),#fff_80%)] border border-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_srgb,var(--primary),#fff_70%)] transition-colors"
            title="Export to CSV"
            >
            <FaDownload className="size-4" />
            Export to CSV
            </button>

            <button
            onClick={openFilterModal}
            className="flex items-center gap-2 p-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
            title="Filter"
            >
            <FaFilter className="size-4" />
            <span className="hidden md:inline">Filter</span>
            </button>


          <div className="relative">
            <input
              type="text"
              placeholder="Quick Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-full md:w-auto md:min-w-[200px] max-w-[150px] md:max-w-none"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]" size={14} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Total Sales</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">${totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Invoices</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">{filteredInvoices.length}</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Pending</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">{pendingCount}</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Completed</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Status
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                ID
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Products
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Price
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Payment Method
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Email
              </th>
              <th className="text-left py-4 px-2 text-[var(--foreground)]">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.length === 0 ? (
              <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] text-center">
                <td colSpan={8} className="py-12 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                  No invoices found
                </td>
              </tr>
            ) : (
              currentInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] hover:bg-[color-mix(in_srgb,var(--background),#333_5%)] cursor-pointer"
                  onClick={() => navigateToInvoice(invoice.id)}
                >
                  {/* Status */}
                  <td className="py-4 px-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}
                    >
                      {invoice.status === "PAID" ? "COMPLETED" : invoice.status}
                    </span>
                  </td>

                  {/* ID */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {invoice.id.substring(0, 8)}...
                  </td>

                  {/* Products */}
                  <td className="py-4 px-2 text-[var(--foreground)] max-w-[250px]">
                    {invoice.OrderItem && invoice.OrderItem.length > 0 ? (() => {
                      const sortedItems = [...invoice.OrderItem].sort((a, b) => b.product.price - a.product.price);
                      const mostExpensive = sortedItems[0];
                      const extraCount = sortedItems.length - 1;

                      return (
                        <div>
                          {mostExpensive.product.name}
                          {extraCount > 0 && ` +${extraCount} more`}
                        </div>
                      );
                    })() : "N/A"}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    ${invoice.totalPrice.toFixed(2)}
                  </td>

                  {/* Payment Method */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {getPaymentMethodName(invoice.paymentType)}
                  </td>

                  {/* Email */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {invoice.customer?.email || "N/A"}
                  </td>

                  {/* Created At */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {formatDate(invoice.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>      {/* Pagination Controls */}
      <div className="mt-6">
        {/* Pagination info - always visible, responsive layout */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-[var(--foreground)] text-sm">
              Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} invoices
            </span>
            {/* Per page selector - only shown on desktop */}
            <select
              className="hidden md:block w-fit p-1 rounded-md bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] text-sm"
              value={itemsPerPage}
              onChange={(e) => {
                const newPageSize = Number(e.target.value);
                setItemsPerPage(newPageSize);
                // Adjust current page to maintain approximately the same starting item
                const firstItemIndex = (currentPage - 1) * itemsPerPage;
                const newPage = Math.floor(firstItemIndex / newPageSize) + 1;
                setCurrentPage(newPage);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          
          <div className="flex items-center justify-center md:justify-end gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className={`p-2 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background_90%)] text-[var(--foreground)] ${
                currentPage <= 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors'
              }`}
            >
              <FaChevronLeft size={14} />
            </button>
            
            <div className="flex items-center">
              <span className="mx-2 text-[var(--foreground)] text-sm">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className={`p-2 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background_90%)] text-[var(--foreground)] ${
                currentPage >= totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors'
              }`}
            >
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useTRPC } from "@/server/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useMemo, useEffect } from "react";
import {
  FaReceipt,
  FaSearch,
  FaDownload,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import InvoiceFilterModal from "./InvoiceFilterModal";
import {
  getStatusBadgeClass,
  formatDate,
  getPaymentDisplayName,
} from "@/utils/invoiceUtils";
import { exportInvoicesToCSV } from "@/utils/csvExport";
import { useInvoiceFilters } from "@/hooks/useInvoiceFilters";
import { formatPrice } from "@/utils/formatting";
import { PaymentMethodLogo } from "@/components/PaymentMethodLogo";

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
    setTempAffiliateFilter,
    setTempCodeFilter,
    setTempPaypalNoteFilter,
    setTempInvoiceIdFilter,
    setTempDateProcessedFilter,
    initializeTempFilters,
    applyFilters,
    resetFilters,
  } = useInvoiceFilters();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filterQueryParams = {
    search: debouncedSearch || undefined,
    status: filters.statusFilter !== "ALL" ? filters.statusFilter : undefined,
    paymentType:
      filters.paymentFilter !== "ALL" ? filters.paymentFilter : undefined,
    email: filters.emailFilter || undefined,
    discord: filters.discordFilter || undefined,
    affiliate: filters.affiliateFilter || undefined,
    product: filters.productFilter || undefined,
    code: filters.codeFilter || undefined,
    paypalNote: filters.paypalNoteFilter || undefined,
    invoiceId: filters.invoiceIdFilter || undefined,
    dateProcessed: filters.dateProcessedFilter || undefined,
  };

  // Export filtered invoices function
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const filteredInvoices = await queryClient.fetchQuery(
        trpc.invoices.getFiltered.queryOptions(filterQueryParams),
      );
      exportInvoicesToCSV(filteredInvoices);
    } catch (error) {
      console.error("Failed to export invoices:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get stats (lightweight aggregate query with filters)
  const { data: stats } = useQuery(
    trpc.invoices.getStats.queryOptions(filterQueryParams),
  );

  // Get paginated invoices (only fetches current page)
  const { data: paginatedData, isLoading } = useQuery(
    trpc.invoices.getPaginated.queryOptions({
      page: currentPage,
      limit: itemsPerPage,
      ...filterQueryParams,
    }),
  );

  const { data: currentProducts = [] } = useQuery(
    trpc.product.getAllWithStock.queryOptions(),
  );

  // Compute product options for the dropdown
  const productOptions = useMemo(() => {
    const currentProductNames = new Set(currentProducts.map((p) => p.name));

    return {
      activeProducts: Array.from(currentProductNames).sort(),
      discontinuedProducts: [] as string[],
      hasDiscontinued: false,
    };
  }, [currentProducts]);

  // Navigate to invoice detail page
  const navigateToInvoice = (invoiceId: string) => {
    router.push(`/admin/invoice/${invoiceId}`);
  };

  const currentInvoices = paginatedData?.invoices || [];
  const totalItems = paginatedData?.totalCount || 0;
  const totalPages = paginatedData?.totalPages || 1;

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

  // Initialize the temporary filters with the current filter values
  const openFilterModal = () => {
    initializeTempFilters();
    setShowFilterModal(true);
  };

  // Apply the temporary filters to the actual filters
  const handleApplyFilters = () => {
    applyFilters();
    setShowFilterModal(false);
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
        tempAffiliateFilter={tempFilters.affiliateFilter}
        tempPaymentFilter={tempFilters.paymentFilter}
        tempDiscordFilter={tempFilters.discordFilter}
        tempCodeFilter={tempFilters.codeFilter}
        tempPaypalNoteFilter={tempFilters.paypalNoteFilter}
        tempInvoiceIdFilter={tempFilters.invoiceIdFilter}
        tempDateProcessedFilter={tempFilters.dateProcessedFilter}
        productOptions={productOptions}
        setTempDateProcessedFilter={setTempDateProcessedFilter}
        setTempInvoiceIdFilter={setTempInvoiceIdFilter}
        setTempStatusFilter={setTempStatusFilter}
        setTempEmailFilter={setTempEmailFilter}
        setTempProductFilter={setTempProductFilter}
        setTempAffiliateFilter={setTempAffiliateFilter}
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
        </h2>{" "}
        <div className="flex gap-3 items-center flex-wrap">
          {/* Export to CSV button - hidden on mobile */}
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="hidden md:flex items-center gap-2 p-2 rounded-lg bg-[color-mix(in_srgb,var(--primary),#fff_80%)] border border-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_srgb,var(--primary),#fff_70%)] transition-colors disabled:opacity-50"
            title="Export all invoices to CSV"
          >
            {isExporting ? (
              <FaSpinner className="size-4 animate-spin" />
            ) : (
              <FaDownload className="size-4" />
            )}
            {isExporting ? "Exporting..." : "Export to CSV"}
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
            {/* Mobile search input */}
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:hidden pl-10 pr-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-full max-w-[150px]"
            />
            {/* Desktop search input */}
            <input
              type="text"
              placeholder="Quick Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hidden md:block pl-10 pr-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-auto min-w-[200px]"
            />
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]"
              size={14}
            />
          </div>
        </div>
      </div>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">
              Total Sales
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {formatPrice(stats?.totalSales || 0)}
            </p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">
              Invoices
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stats?.totalCount || 0}
            </p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">
              Pending
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stats?.pendingCount || 0}
            </p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">
              Completed
            </h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {stats?.completedCount || 0}
            </p>
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
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] animate-pulse"
                >
                  <td className="py-4 px-2">
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </td>
                </tr>
              ))
            ) : currentInvoices.length === 0 ? (
              <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] text-center">
                <td
                  colSpan={7}
                  className="py-12 text-[color-mix(in_srgb,var(--foreground),#888_40%)]"
                >
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
                    {invoice.OrderItem && invoice.OrderItem.length > 0
                      ? (() => {
                          const firstItem = invoice.OrderItem[0];
                          const extraCount = invoice.OrderItem.length - 1;

                          return (
                            <div>
                              {firstItem.product.name}
                              {extraCount > 0 && ` +${extraCount} more`}
                            </div>
                          );
                        })()
                      : "N/A"}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {formatPrice(invoice.totalPrice - invoice.discountAmount)}
                  </td>

                  {/* Payment Method */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    <div className="flex items-center gap-2">
                      <PaymentMethodLogo
                        paymentType={invoice.paymentType}
                        cryptoType={invoice.Wallet?.[0]?.chain}
                      />
                      <span>{getPaymentDisplayName(invoice)}</span>
                    </div>
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
      </div>{" "}
      {/* Pagination Controls */}
      <div className="mt-6">
        {/* Pagination info - always visible, responsive layout */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-[var(--foreground)] text-sm">
              Showing{" "}
              {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} -{" "}
              {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems}{" "}
              invoices
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
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
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
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
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

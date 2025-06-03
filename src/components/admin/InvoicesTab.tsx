import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import { FaReceipt, FaSearch, FaDownload, FaFilter } from "react-icons/fa";
import { OrderStatus, PaymentType } from "@generated";
import { useRouter } from "next/navigation";

export default function InvoicesTab() {
  const trpc = useTRPC();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentType | "ALL">("ALL");
  const [productFilter, setProductFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: invoices = [] } = useQuery(trpc.invoices.getAll.queryOptions());

  // Navigate to invoice detail page
  const navigateToInvoice = (invoiceId: string) => {
    router.push(`/admin/invoice/${invoiceId}`);
  };

  // Filter invoices based on all filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search term filter
      const matchesSearch =
        searchTerm === "" ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        invoice.status === statusFilter;

      // Payment method filter
      const matchesPayment =
        paymentFilter === "ALL" ||
        invoice.paymentType === paymentFilter;

      // Product filter
      const matchesProduct =
        productFilter === "" ||
        invoice.OrderItem?.some(item =>
          item.product.name.toLowerCase().includes(productFilter.toLowerCase())
        );

      return matchesSearch && matchesStatus && matchesPayment && matchesProduct;
    });
  }, [invoices, searchTerm, statusFilter, paymentFilter, productFilter]);

  // Calculate stats
  const totalSales = invoices.reduce((sum, invoice) =>
    invoice.status === OrderStatus.PAID || invoice.status === OrderStatus.DELIVERED
      ? sum + invoice.totalPrice
      : sum, 0
  );

  const pendingCount = invoices.filter(
    (invoice) => invoice.status === OrderStatus.PENDING
  ).length;

  const completedCount = invoices.filter(
    (invoice) =>
      invoice.status === OrderStatus.PAID ||
      invoice.status === OrderStatus.DELIVERED
  ).length;

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true, // or false for 24-hour clock
    });
  };


  // Get payment method display name
  const getPaymentMethodName = (method: PaymentType) => {
    switch (method) {
      case PaymentType.STRIPE:
        return "Stripe";
      case PaymentType.PAYPAL:
        return "PayPal";
      case PaymentType.CRYPTO:
        return "Crypto";
      default:
        return method;
    }
  };

  // Get status badge styling
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID:
        return "bg-green-100 text-green-800";
      case OrderStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case OrderStatus.DELIVERED:
        return "bg-blue-100 text-blue-800";
      case OrderStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "Product",
      "Code(s)",
      "",
      "Date Sold",
      "Payment Method",
      "Amount",
      "Discount",
      "Fees",
      "",
      "",
      "",
      "Buyer Email",
      "Buyer Discord",
      ""
    ].join(",");

    const rows = filteredInvoices.map(invoice => {
      // For each product in the order, create a separate row
      if (invoice.OrderItem && invoice.OrderItem.length > 0) {
        return invoice.OrderItem.map(item => [
          item.product.name,
          item.product.id, // Using product ID as code
          "",
          new Date(invoice.createdAt).toISOString().split("T")[0],
          getPaymentMethodName(invoice.paymentType),
          (item.price * item.quantity).toFixed(2),
          "0.00", // Placeholder for discount
          "0.00", // Placeholder for fees
          "",
          "",
          "",
          invoice.customer?.email || "N/A",
          invoice.customer?.discord || "N/A",
          ""
        ].join(",")).join("\n");
      } else {
        // Fallback for invoices without items
        return [
          "N/A",
          "N/A",
          "",
          new Date(invoice.createdAt).toISOString().split("T")[0],
          getPaymentMethodName(invoice.paymentType),
          invoice.totalPrice.toFixed(2),
          "0.00",
          "0.00",
          "",
          "",
          "",
          invoice.customer?.email || "N/A",
          invoice.customer?.discord || "N/A",
          ""
        ].join(",");
      }
    }).join("\n");

    const csvContent = [headers, rows].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[color-mix(in_srgb,var(--background),#333_15%)] p-6 rounded-xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <FaReceipt />
          Invoices
        </h2>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]" size={14} />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_5%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_10%)] transition-colors"
            title="Toggle filters"
          >
            <FaFilter />
          </button>

          <button
            onClick={exportToCSV}
            className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--primary),#fff_80%)] border border-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_srgb,var(--primary),#fff_70%)] transition-colors"
            title="Export to CSV"
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-[color-mix(in_srgb,var(--background),#333_5%)] rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[color-mix(in_srgb,var(--foreground),#888_20%)] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "ALL")}
                className="w-full p-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_10%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)]"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[color-mix(in_srgb,var(--foreground),#888_20%)] mb-1">Payment Method</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentType | "ALL")}
                className="w-full p-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_10%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)]"
              >
                <option value="ALL">All Payment Methods</option>
                {Object.values(PaymentType).map((type) => (
                  <option key={type} value={type}>{getPaymentMethodName(type)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[color-mix(in_srgb,var(--foreground),#888_20%)] mb-1">Product Name</label>
              <input
                type="text"
                placeholder="Filter by product..."
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full p-2 rounded-lg bg-[color-mix(in_srgb,var(--background),#333_10%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Total Sales</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">${totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-[color-mix(in_srgb,var(--background),#333_5%)] p-4 rounded-lg border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
            <h3 className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-1">Invoices</h3>
            <p className="text-2xl font-bold text-[var(--foreground)]">{invoices.length}</p>
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
            {filteredInvoices.length === 0 ? (
              <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] text-center">
                <td colSpan={8} className="py-12 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
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
                      {invoice.status}
                    </span>
                  </td>

                  {/* ID */}
                  <td className="py-4 px-2 text-[var(--foreground)]">
                    {invoice.id.substring(0, 8)}...
                  </td>

                  {/* Products */}
                  <td className="py-4 px-2 text-[var(--foreground)] max-w-[250px]">
                    {invoice.OrderItem && invoice.OrderItem.length > 0 ? (
                      <div className="max-h-[100px] overflow-y-auto">
                        {invoice.OrderItem.map((item, index) => (
                          <div key={index} className="mb-1">
                            x{item.quantity} {item.product.name}
                          </div>
                        ))}
                      </div>
                    ) : "N/A"}
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
      </div>
    </div>
  );
} 
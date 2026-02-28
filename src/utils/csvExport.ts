import {
  getPaymentMethodName,
  getShortenedProductName,
  formatDateTimeForCSV,
} from "@/utils/invoiceUtils";
import { PaymentType } from "@generated/browser";

export interface Invoice {
  id: string;
  status: string;
  createdAt: Date;
  totalPrice: number;
  paymentFee: number;
  discountAmount: number;
  paymentType: PaymentType;
  notes?: string[] | null;
  customer?: {
    email?: string | null;
    discord?: string | null;
  } | null;
  OrderItem?: Array<{
    product: {
      name: string;
    };
    codes: string[];
    price: number;
    quantity: number;
  }>;
}

const getReplacementNoteForCSV = (notes?: string[] | null) => {
  if (!notes || notes.length === 0) return "";

  const replacementNote = [...notes]
    .reverse()
    .find((note) => typeof note === "string" && note.startsWith("REPLACED:"));

  if (!replacementNote) return "";

  const timestampMatch = replacementNote.match(
    /(\d{1,2}\/\d{1,2}\/\d{4}\s\d{2}:\d{2}:\d{2})/,
  );

  return timestampMatch ? `Replaced (${timestampMatch[1]})` : "Replaced";
};

export const exportInvoicesToCSV = (invoices: Invoice[]) => {
  // Create CSV headers
  const headers = [
    "Status",
    "Product",
    "Code(s)",
    "Date Sold",
    "Payment Method",
    "Amount",
    "Discount",
    "Fees",
    "Buyer Email",
    "Buyer Discord",
    "Order ID",
    "",
  ].join(",");

  // Map invoices to CSV rows
  const rows = invoices
    .map((invoice) => {
      const replacementNote = getReplacementNoteForCSV(invoice.notes);

      // For each product in the order, create a separate row
      if (invoice.OrderItem && invoice.OrderItem.length > 0) {
        return invoice.OrderItem.flatMap((item) => {
          // If the item has codes, create one row per code
          if (item.codes && item.codes.length > 0) {
            return item.codes.map((code) =>
              [
                invoice.status,
                getShortenedProductName(item.product.name),
                `"${code}"`,
                formatDateTimeForCSV(invoice.createdAt),
                getPaymentMethodName(invoice.paymentType),
                item.price.toFixed(2),
                invoice.discountAmount.toFixed(2),
                invoice.paymentFee.toFixed(2),
                invoice.customer?.email || "N/A",
                invoice.customer?.discord || "N/A",
                invoice.id.substring(0, 8),
                replacementNote,
              ].join(","),
            );
          } else {
            // If no codes (e.g., cancelled), create one row for the item
            return [
              [
                invoice.status,
                getShortenedProductName(item.product.name),
                "N/A",
                formatDateTimeForCSV(invoice.createdAt),
                getPaymentMethodName(invoice.paymentType),
                item.price.toFixed(2),
                invoice.discountAmount.toFixed(2),
                invoice.paymentFee.toFixed(2),
                invoice.customer?.email || "N/A",
                invoice.customer?.discord || "N/A",
                invoice.id.substring(0, 8),
                replacementNote,
              ].join(","),
            ];
          }
        }).join("\n");
      } else {
        // Fallback for invoices without items
        return [
          invoice.status,
          "N/A",
          "N/A",
          formatDateTimeForCSV(invoice.createdAt),
          getPaymentMethodName(invoice.paymentType),
          invoice.totalPrice.toFixed(2),
          invoice.discountAmount.toFixed(2),
          invoice.paymentFee.toFixed(2),
          invoice.customer?.email || "N/A",
          invoice.customer?.discord || "N/A",
          invoice.id.substring(0, 8),
          replacementNote,
        ].join(",");
      }
    })
    .join("\n");

  const csvContent = [headers, rows].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `invoices_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

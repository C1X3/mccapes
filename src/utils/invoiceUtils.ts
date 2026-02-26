import { OrderStatus, PaymentType } from "@generated/browser";

// Type for invoice in utility functions
type InvoiceWithWallet = {
  paymentType: PaymentType;
  Wallet?: Array<{
    chain: string;
  }>;
};

// Utility function to get payment method display name including specific crypto types
export const getPaymentDisplayName = (invoice: InvoiceWithWallet): string => {
  if (
    invoice.paymentType === PaymentType.CRYPTO &&
    invoice.Wallet?.[0]?.chain
  ) {
    const cryptoType = invoice.Wallet[0].chain;
    return (
      cryptoType.charAt(0).toUpperCase() + cryptoType.slice(1).toLowerCase()
    );
  }
  return getPaymentMethodName(invoice.paymentType);
};

// Utility function to get payment method display name
export const getPaymentMethodName = (method: PaymentType): string => {
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

// Utility function to format date for CSV export
export const formatDateTimeForCSV = (date: Date): string => {
  const d = new Date(date);
  const month = d.getMonth() + 1; // getMonth() is 0-indexed
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

// Utility function to get product name based on the code for CSV and Mobile UI invoices
export const getShortenedProductName = (name: string): string => {
  // if the name is Experience Cape Code make it MCE
  if (name === "Experience Cape Code") {
    return "MCE";
  } else if (name === "Purple Heart Cape Code") {
    return "Twitch";
  } else if (name === "Follower's Cape Code") {
    return "TikTok";
  } else if (name === "Home Cape Code") {
    return "Home";
  } else if (name === "Menace Cape Code") {
    return "Menace";
  } else {
    return name;
  }
};

// Utility function to get status badge styling
export const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PAID:
      return "bg-status-completed-bg text-status-completed-text";
    case OrderStatus.PENDING:
      return "bg-status-pending-bg text-status-pending-text";
    case OrderStatus.DELIVERED:
      return "bg-status-completed-bg text-status-completed-text";
    case OrderStatus.CANCELLED:
      return "bg-status-cancelled-bg text-status-cancelled-text";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Utility function to format date
export const formatDate = (
  date: Date,
  format: "short" | "long" = "short",
): string => {
  if (format === "long") {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
};

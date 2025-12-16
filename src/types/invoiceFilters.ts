import { OrderStatus, PaymentType, CryptoType } from "@generated";

// Extended payment filter type that includes individual crypto types
export type PaymentFilterType = PaymentType | CryptoType | "ALL";

// Interface for invoice filter state
export interface InvoiceFilters {
  statusFilter: OrderStatus | "ALL";
  paymentFilter: PaymentFilterType;
  productFilter: string;
  emailFilter: string;
  discordFilter: string;
  affiliateFilter: string;
  codeFilter: string;
  paypalNoteFilter: string;
  invoiceIdFilter: string;
  dateProcessedFilter: string;
}

// Default filter values
export const defaultFilters: InvoiceFilters = {
  statusFilter: "ALL",
  paymentFilter: "ALL",
  productFilter: "",
  emailFilter: "",
  discordFilter: "",
  affiliateFilter: "",
  codeFilter: "",
  paypalNoteFilter: "",
  invoiceIdFilter: "",
  dateProcessedFilter: "",
};

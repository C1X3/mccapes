import { OrderStatus, PaymentType, CryptoType } from "@generated/browser";

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
  /** When false, hide orders whose notes include a SellAuth import line (e.g. "SellAuth: 4490703"). */
  includeSellAuth: boolean;
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
  includeSellAuth: true,
};

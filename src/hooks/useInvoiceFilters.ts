import { useState } from "react";
import { InvoiceFilters, defaultFilters } from "@/types/invoiceFilters";

export const useInvoiceFilters = () => {
  // Main filter state
  const [filters, setFilters] = useState<InvoiceFilters>(defaultFilters);
  
  // Temporary filter state for modal
  const [tempFilters, setTempFilters] = useState<InvoiceFilters>(defaultFilters);

  // Individual setters for temp filters (for backward compatibility with modal)
  const setTempStatusFilter = (value: InvoiceFilters["statusFilter"]) =>
    setTempFilters(prev => ({ ...prev, statusFilter: value }));
  
  const setTempPaymentFilter = (value: InvoiceFilters["paymentFilter"]) =>
    setTempFilters(prev => ({ ...prev, paymentFilter: value }));
  
  const setTempProductFilter = (value: InvoiceFilters["productFilter"]) =>
    setTempFilters(prev => ({ ...prev, productFilter: value }));
  
  const setTempEmailFilter = (value: InvoiceFilters["emailFilter"]) =>
    setTempFilters(prev => ({ ...prev, emailFilter: value }));
  
  const setTempDiscordFilter = (value: InvoiceFilters["discordFilter"]) =>
    setTempFilters(prev => ({ ...prev, discordFilter: value }));
  
  const setTempAffiliateFilter = (value: InvoiceFilters["affiliateFilter"]) =>
    setTempFilters(prev => ({ ...prev, affiliateFilter: value }));
  
  const setTempCodeFilter = (value: InvoiceFilters["codeFilter"]) =>
    setTempFilters(prev => ({ ...prev, codeFilter: value }));
  
  const setTempPaypalNoteFilter = (value: InvoiceFilters["paypalNoteFilter"]) =>
    setTempFilters(prev => ({ ...prev, paypalNoteFilter: value }));
  
  const setTempInvoiceIdFilter = (value: InvoiceFilters["invoiceIdFilter"]) =>
    setTempFilters(prev => ({ ...prev, invoiceIdFilter: value }));
  
  const setTempDateProcessedFilter = (value: InvoiceFilters["dateProcessedFilter"]) =>
    setTempFilters(prev => ({ ...prev, dateProcessedFilter: value }));

  // Initialize temp filters with current filters
  const initializeTempFilters = () => {
    setTempFilters(filters);
  };

  // Apply temp filters to main filters
  const applyFilters = () => {
    setFilters(tempFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
  };

  return {
    // Main filter state
    filters,
    setFilters,
    
    // Temp filter state
    tempFilters,
    setTempFilters,
    
    // Individual temp filter setters
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
    
    // Actions
    initializeTempFilters,
    applyFilters,
    resetFilters,
  };
};

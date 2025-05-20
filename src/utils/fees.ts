import { PaymentType } from "@generated";

// Payment method fee percentages
export const PAYMENT_METHOD_FEES = {
  [PaymentType.CRYPTO]: 0.015, // 1.5%
  [PaymentType.PAYPAL]: 0.025, // 2.5%
  [PaymentType.STRIPE]: 0.04,  // 4%
  [PaymentType.CASH_APP]: 0,   // 0%
  [PaymentType.VENMO]: 0,      // 0%
};

/**
 * Calculate fee amount based on payment type and subtotal
 */
export function calculatePaymentFee(paymentType: PaymentType, subtotal: number): number {
  const feePercentage = PAYMENT_METHOD_FEES[paymentType] || 0;
  return subtotal * feePercentage;
}

/**
 * Calculate total price with fee
 */
export function calculateTotalWithFee(paymentType: PaymentType, subtotal: number): number {
  const fee = calculatePaymentFee(paymentType, subtotal);
  return subtotal + fee;
}

/**
 * Format payment fee as percentage for display
 */
export function formatFeePercentage(paymentType: PaymentType): string {
  const percentage = PAYMENT_METHOD_FEES[paymentType] * 100;
  return percentage > 0 ? `${percentage}%` : "No fee";
} 
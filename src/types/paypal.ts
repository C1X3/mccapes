// types/paypal.ts
export type TxnType =
  | "send_money"
  | "web_accept"
  | "subscr_signup" /* …other PayPal txn types*/;
export type PaymentStatus =
  | "Completed"
  | "Pending"
  | "Denied"
  | "Refunded"
  | "Reversed";

export interface PayPalIPNData {
  transactionSubject: string; // custom subject, if any
  txnType: TxnType; // e.g. 'send_money'
  paymentDate: string; // raw timestamp string
  lastName: string;
  firstName: string;
  residenceCountry: string; // e.g. 'US'
  payerStatus: string; // e.g. 'verified' | 'unverified'
  payerEmail: string;
  payerId: string;
  receiverEmail: string;
  receiverId: string;
  memo: string;
  paymentStatus: PaymentStatus;
  paymentType: string; // e.g. 'instant'
  protectionEligibility: string;
  mcGross: number; // amount, parsed as number
  mcCurrency: string; // e.g. 'USD'
  txnId: string;
  verifySign: string;
  charset: string;
  notifyVersion: string;
  ipnTrackId: string;
}

export function parseIPN(body: string): PayPalIPNData {
  const params = new URLSearchParams(body);

  // helper to grab and default
  const get = (key: string) => params.get(key) ?? "";

  return {
    transactionSubject: get("transaction_subject"),
    txnType: get("txn_type") as PayPalIPNData["txnType"],
    paymentDate: get("payment_date"),
    lastName: get("last_name"),
    firstName: get("first_name"),
    residenceCountry: get("residence_country"),
    payerStatus: get("payer_status"),
    payerEmail: get("payer_email"),
    payerId: get("payer_id"),
    receiverEmail: get("receiver_email"),
    receiverId: get("receiver_id"),
    memo: get("memo"),
    paymentStatus: get("payment_status") as PayPalIPNData["paymentStatus"],
    paymentType: get("payment_type"),
    protectionEligibility: get("protection_eligibility"),
    mcGross: parseFloat(get("mc_gross")),
    mcCurrency: get("mc_currency"),
    txnId: get("txn_id"),
    verifySign: get("verify_sign"),
    charset: get("charset"),
    notifyVersion: get("notify_version"),
    ipnTrackId: get("ipn_track_id"),
  };
}

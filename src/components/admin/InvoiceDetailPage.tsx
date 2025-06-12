'use client';

import { useTRPC } from "@/server/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { FaBox, FaUser, FaShoppingBag, FaFileInvoice, FaTrash } from "react-icons/fa";
import { OrderStatus, PaymentType } from "@generated";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { getPaymentMethodName, getStatusBadgeClass, formatDate } from "@/utils/invoiceUtils";

export default function InvoiceDetailPage({ id }: { id: string }) {
  const trpc = useTRPC();

  const { data: invoice, isLoading, error } = useQuery(
    trpc.invoices.getById.queryOptions({
      orderId: id as string,
    }),
  );

  const { mutate: manuallyProcessInvoice, isPending: isManuallyProcessing } = useMutation(
    trpc.checkout.manuallyProcessInvoice.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice manually processed");
      },
      onError: () => {
        toast.error("Failed to manually process invoice");
      },
    }),
  );

  const { mutate: cancelInvoice, isPending: isCancelling } = useMutation(
    trpc.checkout.cancelInvoice.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice cancelled");
      },
      onError: () => {
        toast.error("Failed to cancel invoice");
      },
    }),
  );
  const handleManuallyProcessInvoice = () => {
    manuallyProcessInvoice({
      orderId: id as string,
    });
  };

  const handleCancelInvoice = () => {
    cancelInvoice({
      orderId: id as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg">
        <h3 className="font-bold">Error loading invoice</h3>
        <p>{error?.message || "Invoice not found"}</p>
        <Link href="/admin?tab=invoices" className="text-blue-600 underline mt-2 inline-block">
          Return to invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Invoice Details</h1>
          <p className="text-gray-400 text-sm">View the details of the invoice.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 flex items-center gap-2 bg-transparent border border-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            onClick={handleManuallyProcessInvoice}
          >
            <FaFileInvoice /> {isManuallyProcessing ? "Processing..." : "Manually Process Invoice"}
          </button>
          {invoice.status == OrderStatus.PENDING && <div className="flex gap-2">
            <button
              className="px-4 py-2 flex items-center gap-2 bg-transparent border border-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              onClick={handleCancelInvoice}
            >
              <FaTrash /> {isCancelling ? "Cancelling..." : "Cancel Invoice"}
            </button>
          </div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information Card */}
        <div className="bg-white rounded-lg shadow text-black p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaShoppingBag className="text-gray-500" />
            <h2 className="font-semibold">Order Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">ID</span>
              <span>{invoice.id}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}>
                {invoice.status === "PAID" ? "COMPLETED" : invoice.status}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Payment Method</span>
              <div className="flex items-center gap-2">
                <span>
                  {getPaymentMethodName(invoice.paymentType)}
                  {invoice.paymentType === PaymentType.CRYPTO && invoice.Wallet?.[0]?.chain && 
                    ` (${invoice.Wallet[0].chain})`
                  }
                </span>
                {invoice.paymentType === PaymentType.STRIPE && (
                  <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs">S</div>
                )}
              </div>
            </div>            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>
                ${invoice.totalPrice ? invoice.totalPrice.toFixed(2) : "129.99"}
                {invoice.couponDetails && (
                  <span className="text-green-600 ml-2">
                    ({invoice.couponDetails.type === 'PERCENTAGE' ? `-${invoice.couponDetails.discount}%` : `-$${invoice.couponDetails.discount.toFixed(2)}`})
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Gateway Fee</span>
              <span>${invoice.paymentFee ? invoice.paymentFee.toFixed(2) : "3.20"}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Total Price</span>
              <span>${(invoice.totalPrice + invoice.paymentFee).toFixed(2)}</span>
            </div>

            {invoice.couponUsed && <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Coupon</span>
              <span>
                {invoice.couponUsed}
                {invoice.couponDetails && (
                  <span className="text-green-600 ml-2">
                    ({invoice.couponDetails.type === 'PERCENTAGE' ? `${invoice.couponDetails.discount}% OFF` : `$${invoice.couponDetails.discount.toFixed(2)} off`})
                  </span>
                )}
              </span>
            </div>}

            {invoice.paymentType === PaymentType.CRYPTO && <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Transaction ID</span>
              <span>{invoice.Wallet?.[0]?.txHash || "N/A"}</span>
            </div>}

            {invoice.paymentType === PaymentType.PAYPAL && <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Paypal Note</span>
              <span>{invoice.paypalNote || "N/A"}</span>
            </div>}

            <div className="flex justify-between pb-2">
              <span className="text-gray-600">Created At</span>
              <span>{formatDate(invoice.createdAt, 'long')}</span>
            </div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="bg-white rounded-lg shadow text-black p-4">
          <div className="flex items-center gap-2 mb-4">
            <FaUser className="text-gray-500" />
            <h2 className="font-semibold">Customer Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">E-mail Address</span>
              <span>{invoice.customer?.email || "rea321052@gmail.com"}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">IP Address</span>
              <span>{invoice.customer?.ipAddress || "5.238.169.147"}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Country</span>
              <div className="flex items-center gap-2">
                <span>{"US"}</span>
                <Image src="https://flagsapi.com/US/flat/64.png" alt="US" className="w-6 h-4" width={64} height={64} />
              </div>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">User Agent</span>
              <span className="text-sm truncate max-w-[300px]">{invoice.customer?.useragent || "Mozilla/5.0 (Linux, Android 10, K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36"}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-600">Discord Username</span>
              <span>{invoice.customer?.discord || "Not provided"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mt-6 bg-white rounded-lg shadow text-black p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaBox className="text-gray-500" />
          <h2 className="font-semibold">Items</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Product & Variant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Quantity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Total Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Code(s)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {invoice.OrderItem.map((item) => (
                <tr className="border-b border-gray-100" key={item.id}>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}>
                      {invoice.status === OrderStatus.PAID ? "COMPLETED" : invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.product.slug}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{item.quantity}</td>
                  <td className="py-3 px-4">${(item.price * item.quantity).toFixed(2)}</td>
                  <td className="py-3 px-4">{item.codes.join(", ")}</td>
                  <td className="py-3 px-4">{invoice.status === OrderStatus.DELIVERED ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
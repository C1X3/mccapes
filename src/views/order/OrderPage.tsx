"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/utils/formatting";
import { formatFeePercentage } from "@/utils/fees";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import Image from "next/image";
import ProductCapeViewer from "@/components/ProductCapeViewer";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaCheck,
  FaClock,
  FaExclamationTriangle,
  FaShippingFast,
  FaTimesCircle,
  FaCopy,
  FaBitcoin,
  FaEthereum,
} from "react-icons/fa";
import { SiLitecoin, SiSolana } from "react-icons/si";
import { useTRPC } from "@/server/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { CryptoType, OrderStatus, PaymentType } from "@generated/browser";

// Confirmation thresholds for different crypto types
const CONFIRMATION_THRESHOLDS: Record<CryptoType, number> = {
  [CryptoType.BITCOIN]: 1,
  [CryptoType.LITECOIN]: 1,
  [CryptoType.ETHEREUM]: 1,
  [CryptoType.SOLANA]: 1,
};

// Icons for different crypto types
const CRYPTO_ICONS: Record<CryptoType, React.ReactNode> = {
  [CryptoType.BITCOIN]: <FaBitcoin className="text-[#f7931a]" />,
  [CryptoType.ETHEREUM]: <FaEthereum className="text-[#627eea]" />,
  [CryptoType.LITECOIN]: <SiLitecoin className="text-[#345d9d]" />,
  [CryptoType.SOLANA]: <SiSolana className="text-[#14f195]" />,
};

// Background gradients for different crypto types
const CRYPTO_GRADIENTS: Record<CryptoType, string> = {
  [CryptoType.BITCOIN]: "from-[#f7931a]/10 to-[#f7931a]/5",
  [CryptoType.ETHEREUM]: "from-[#627eea]/10 to-[#627eea]/5",
  [CryptoType.LITECOIN]: "from-[#345d9d]/10 to-[#345d9d]/5",
  [CryptoType.SOLANA]: "from-[#14f195]/10 to-[#14f195]/5",
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  let color = "";
  let Icon = FaClock;
  let text = "Processing";

  switch (status) {
    case "PENDING":
      color = "bg-yellow-500";
      Icon = FaClock;
      text = "Pending Payment";
      break;
    case "PAID":
      color = "bg-success";
      Icon = FaCheck;
      text = "Payment Confirmed";
      break;
    case "DELIVERED":
      color = "bg-blue-500";
      Icon = FaShippingFast;
      text = "Delivered";
      break;
    case "CANCELLED":
      color = "bg-red-500";
      Icon = FaTimesCircle;
      text = "Cancelled";
      break;
  }

  return (
    <div
      className={`px-4 py-2 ${color} rounded-full text-white inline-flex items-center`}
    >
      <Icon className="mr-2" />
      {text}
    </div>
  );
};

const ConfirmationProgress = ({
  confirmations,
  cryptoType,
}: {
  confirmations: number;
  cryptoType: CryptoType;
}) => {
  const threshold = CONFIRMATION_THRESHOLDS[cryptoType];
  const progressPercentage = Math.min((confirmations / threshold) * 100, 100);

  return (
    <div className="mt-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-[var(--foreground)]">
          Confirmations: {confirmations}/{threshold}
        </span>
        <span className="text-sm text-[var(--primary)]">
          {progressPercentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const OrderPage = ({ id }: { id: string }) => {
  const trpc = useTRPC();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string | null>(null);
  const {
    data: order,
    isLoading: isOrderLoading,
    refetch: refetchOrder,
  } = useQuery(trpc.checkout.getOrderStatus.queryOptions({ orderId: id }));

  const { data: walletDetails, isLoading: walletLoading } = useQuery(
    trpc.checkout.getCryptoWalletDetails.queryOptions({ orderId: id }),
  );

  const markAsDelivered = useMutation(
    trpc.checkout.updateOrderStatus.mutationOptions(),
  );
  const isWalletLoading = useMemo(
    () => order?.paymentType === PaymentType.CRYPTO && walletLoading,
    [order, walletLoading],
  );
  const isLoading = useMemo(
    () => isOrderLoading || isWalletLoading,
    [isOrderLoading, isWalletLoading],
  );
  const finalPrice = useMemo(() => {
    if (!order || !order.totalPrice) return 0;
    return (
      order.totalPrice - (order.discountAmount ?? 0) + (order.paymentFee ?? 0)
    );
  }, [order]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (isLoading) return;

      if (order?.status === "PAID") {
        markAsDelivered.mutate({
          orderId: id,
          status: "DELIVERED",
        });
        clearInterval(iv);
      } else if (order?.status === "PENDING") {
        refetchOrder();
      }
    }, 3000);

    return () => clearInterval(iv);
  }, [refetchOrder, order?.status, markAsDelivered, id, isLoading]);

  const copyToClipboard = (code: string | null) => {
    if (code === null) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const isConfirmationComplete =
    walletDetails?.confirmations && walletDetails.chain
      ? walletDetails.confirmations >=
        CONFIRMATION_THRESHOLDS[walletDetails.chain]
      : false;
  const showCryptoPaymentDetails =
    order?.paymentType === "CRYPTO" &&
    order?.status === "PENDING" &&
    walletDetails &&
    !isConfirmationComplete;

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--background)] flex flex-col">
        <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
        <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />
        <header className="relative z-10 py-8" />
        <div className="relative z-10 container mx-auto px-4 flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
        </div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--background)] flex flex-col">
        <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
        <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />
        <header className="relative z-10 py-8" />
        <div className="relative z-10 container mx-auto px-4 flex-grow">
          <div className="max-w-4xl mx-auto py-16">
            <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-8 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 w-16 h-16 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <FaExclamationTriangle size={28} />
                </div>
                <h1 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
                  Order Not Found
                </h1>
                <p className="text-[var(--color-text-secondary)] mb-8">
                  {"We couldn't find the order you're looking for."}
                </p>
                <Link href="/shop">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-lg"
                  >
                    Return to Shop
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] flex flex-col">
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />
      <header className="relative z-10 py-8" />

      <div className="relative z-10 container mx-auto px-4 flex-grow">
        <div className="max-w-5xl mx-auto py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              Order Details
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mx-auto rounded-full"></div>
          </div>

          {order?.paymentType === PaymentType.CRYPTO &&
            order.status === "PENDING" &&
            isConfirmationComplete && (
              <div className="mb-8">
                <div className="bg-gradient-to-b from-green-500/10 to-green-500/5 rounded-xl p-6 border border-green-500/20 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center mr-3 bg-success/20 text-success rounded-full">
                        <FaCheck size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-[var(--foreground)]">
                        Payment Confirmed!
                      </h2>
                    </div>
                    <div className="px-4 py-2 bg-success rounded-full text-white inline-flex items-center">
                      <FaCheck className="mr-2" />
                      Confirmed
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500 mr-2"></div>
                    <p className="text-[var(--color-text-secondary)]">
                      Your payment has been confirmed! Your order is being
                      processed and will be delivered shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {showCryptoPaymentDetails && order.status === "PENDING" && (
            <div className="mb-8">
              <div
                className={`bg-gradient-to-b ${CRYPTO_GRADIENTS[walletDetails.chain]} rounded-xl p-6 border border-[var(--border)] shadow-lg backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center mr-3 text-2xl">
                      {CRYPTO_ICONS[walletDetails.chain]}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      {walletDetails.chain} Payment
                    </h2>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                  <div className="flex flex-col items-center justify-center md:col-span-2">
                    <div className="bg-white p-3 rounded-xl shadow-md w-full max-w-[220px]">
                      <QRCode
                        value={walletDetails.address}
                        size={200}
                        level="H"
                        className="w-full h-auto"
                        fgColor="#000000"
                        bgColor="#ffffff"
                      />
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Scan this QR code with your wallet app
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:col-span-3">
                    <div className="bg-[color-mix(in_srgb,var(--background),#fff_5%)] rounded-xl p-6 h-full">
                      <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 flex items-center">
                        <span className="bg-[var(--primary)]/10 text-[var(--primary)] w-7 h-7 flex items-center justify-center rounded-full mr-2 text-sm">
                          1
                        </span>
                        Payment Details
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">
                            Send Amount
                          </label>
                          <div className="flex items-center">
                            <div
                              className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-3 rounded-md font-mono text-base flex-grow mr-2 cursor-pointer hover:bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] transition-colors"
                              onClick={() =>
                                copyToClipboard(
                                  walletDetails.expectedAmount?.toString(),
                                )
                              }
                              title="Click to copy amount"
                            >
                              <span className="font-bold">
                                {walletDetails.expectedAmount?.toString()}
                              </span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                copyToClipboard(
                                  walletDetails.expectedAmount?.toString(),
                                )
                              }
                              className="p-2 bg-[color-mix(in_srgb,var(--primary),#fff_90%)] text-[var(--primary)] rounded-md"
                            >
                              {copiedCode ===
                              walletDetails.expectedAmount?.toString() ? (
                                <FaCheck />
                              ) : (
                                <FaCopy />
                              )}
                            </motion.button>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">
                            Wallet Address
                          </label>
                          <div className="flex items-center">
                            <div
                              className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-3 rounded-md overflow-hidden text-ellipsis font-mono text-sm flex-grow mr-2 cursor-pointer hover:bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] transition-colors"
                              onClick={() =>
                                copyToClipboard(walletDetails.address)
                              }
                              title="Click to copy address"
                            >
                              {walletDetails.address}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                copyToClipboard(walletDetails.address)
                              }
                              className="p-2 bg-[color-mix(in_srgb,var(--primary),#fff_90%)] text-[var(--primary)] rounded-md"
                            >
                              {copiedCode === walletDetails.address ? (
                                <FaCheck />
                              ) : (
                                <FaCopy />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-lg font-medium text-[var(--foreground)] mt-6 mb-4 flex items-center">
                        <span className="bg-[var(--primary)]/10 text-[var(--primary)] w-7 h-7 flex items-center justify-center rounded-full mr-2 text-sm">
                          2
                        </span>
                        Payment Status
                      </h3>

                      <div className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-4 rounded-lg mb-4">
                        <p className="text-[var(--color-text-secondary)]">
                          {walletDetails.txHash ? (
                            <span className="flex items-center">
                              <FaCheck className="text-green-500 mr-2" />{" "}
                              Payment received! Waiting for network
                              confirmations.
                            </span>
                          ) : walletDetails.paid ? (
                            <span className="flex items-center">
                              <FaCheck className="text-green-500 mr-2" />{" "}
                              Payment detected! Waiting for transaction
                              confirmation.
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <FaClock className="text-yellow-500 mr-2" />{" "}
                              Waiting for payment. This may take a few minutes
                              after sending.
                            </span>
                          )}
                        </p>
                        {walletDetails.txHash && (
                          <div className="mt-2 flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[var(--primary)] mr-2"></div>
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              Processing payment confirmation...
                            </span>
                          </div>
                        )}
                      </div>

                      <ConfirmationProgress
                        confirmations={walletDetails.confirmations || 0}
                        cryptoType={walletDetails.chain}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {order.paymentType === PaymentType.PAYPAL &&
            order.status === "PENDING" && (
              <div className="mb-8">
                <div className="bg-gradient-to-b from-[#0d9ad129] to-[#0d9ad110] rounded-xl p-6 border border-[var(--border)] shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center mr-3 text-2xl text-[#0d9ad1]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 384 512"
                          className="w-6 h-6 fill-current"
                        >
                          <path d="M111.4 295.9c-3.5 19.2-17.4 108.7-21.5 134-.3 1.8-1 2.5-3 2.5H12.3c-7.6 0-13.1-6.6-12.1-13.9L58.8 46.6c1.5-9.6 10.1-16.9 20-16.9 152.3 0 165.1-3.7 204 11.4 60.1 23.3 65.6 79.5 44 140.3-21.5 62.6-72.5 89.5-140.1 90.3-43.4.7-69.5-7-75.3 24.2zM357.1 152c-1.8-1.3-2.5-1.8-3 1.3-2 11.4-5.1 22.5-8.8 33.6-39.9 113.8-150.5 103.9-204.5 103.9-6.1 0-10.1 3.3-10.9 9.4-22.6 140.4-27.1 169.7-27.1 169.7-1 7.1 3.5 12.9 10.6 12.9h63.5c8.6 0 15.7-6.3 17.4-14.9.7-5.4-1.1 6.1 14.4-91.3 4.6-22 14.3-19.7 29.3-19.7 71 0 126.4-28.8 142.9-112.3 6.5-34.8 4.6-71.4-23.8-92.6z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-[var(--foreground)]">
                        PayPal Payment
                      </h2>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                    <div className="flex flex-col items-center justify-center md:col-span-2">
                      <div className="bg-white p-3 rounded-xl shadow-md w-full max-w-[220px]">
                        {/* Temporary QR code */}
                        <Image
                          src={`/paypalqrcode.png`}
                          alt="PayPal"
                          width={200}
                          height={200}
                        />
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Scan to pay with PayPal
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:col-span-3">
                      <div className="bg-[color-mix(in_srgb,var(--background),#fff_5%)] rounded-xl p-6 h-full">
                        <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 flex items-center">
                          <span className="bg-[#0d9ad1]/10 text-[#0d9ad1] w-7 h-7 flex items-center justify-center rounded-full mr-2 text-sm">
                            1
                          </span>
                          Payment Details
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">
                              Send Amount
                            </label>
                            <div className="flex items-center">
                              <div
                                className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-3 rounded-md font-mono text-base flex-grow mr-2 cursor-pointer hover:bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] transition-colors"
                                onClick={() =>
                                  copyToClipboard(finalPrice.toString())
                                }
                                title="Click to copy amount"
                              >
                                <span className="font-bold">
                                  {formatPrice(finalPrice)}
                                </span>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  copyToClipboard(finalPrice.toString())
                                }
                                className="p-2 bg-[#0d9ad1]/10 text-[#0d9ad1] rounded-md"
                              >
                                {copiedCode === finalPrice.toString() ? (
                                  <FaCheck />
                                ) : (
                                  <FaCopy />
                                )}
                              </motion.button>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">
                              PayPal Email
                            </label>
                            <div className="flex items-center">
                              <div
                                className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-3 rounded-md overflow-hidden text-ellipsis font-mono text-sm flex-grow mr-2 cursor-pointer hover:bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] transition-colors"
                                onClick={() =>
                                  copyToClipboard(
                                    String(
                                      process.env.NEXT_PUBLIC_PAYPAL_EMAIL ||
                                        "email@example.com",
                                    ),
                                  )
                                }
                                title="Click to copy email"
                              >
                                {process.env.NEXT_PUBLIC_PAYPAL_EMAIL ||
                                  "email@example.com"}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  copyToClipboard(
                                    String(
                                      process.env.NEXT_PUBLIC_PAYPAL_EMAIL ||
                                        "email@example.com",
                                    ),
                                  )
                                }
                                className="p-2 bg-[#0d9ad1]/10 text-[#0d9ad1] rounded-md"
                              >
                                {copiedCode ===
                                String(
                                  process.env.NEXT_PUBLIC_PAYPAL_EMAIL ||
                                    "email@example.com",
                                ) ? (
                                  <FaCheck />
                                ) : (
                                  <FaCopy />
                                )}
                              </motion.button>
                            </div>
                          </div>

                          {order.paypalNote && (
                            <div>
                              <label className="text-sm font-medium text-[var(--foreground)] mb-1 block">
                                Payment Note
                              </label>
                              <div className="flex items-center">
                                {" "}
                                <div
                                  className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-3 rounded-md overflow-hidden text-ellipsis font-mono text-sm flex-grow mr-2 cursor-pointer hover:bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] transition-colors"
                                  onClick={() =>
                                    copyToClipboard(order.paypalNote || "")
                                  }
                                  title="Click to copy note"
                                >
                                  {order.paypalNote}
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    copyToClipboard(order.paypalNote || "")
                                  }
                                  className="p-2 bg-[#0d9ad1]/10 text-[#0d9ad1] rounded-md"
                                >
                                  {copiedCode === order.paypalNote ? (
                                    <FaCheck />
                                  ) : (
                                    <FaCopy />
                                  )}
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-medium text-[var(--foreground)] mt-6 mb-4 flex items-center">
                          <span className="bg-[#0d9ad1]/10 text-[#0d9ad1] w-7 h-7 flex items-center justify-center rounded-full mr-2 text-sm">
                            2
                          </span>
                          Important Instructions
                        </h3>

                        <div className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] p-4 rounded-lg mb-4">
                          <p className="text-[var(--color-text-secondary)] mb-2">
                            <span className="flex items-center text-red-500">
                              <FaExclamationTriangle className="mr-2" /> Send as
                              &quot;Friends and Family&quot; only!
                            </span>
                          </p>
                          <p className="text-[var(--color-text-secondary)]">
                            Your order will{" "}
                            <span className="font-bold">NOT</span> be processed
                            if payment is not sent using the &quot;Friends and
                            Family&quot; option. This helps us avoid unnecessary
                            fees and delays.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Order Status Card */}
              <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-6 shadow-md backdrop-blur-sm">
                {" "}
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      Order #{(order.orderId || "").substring(0, 8)}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                      {order.createdAt &&
                        `Placed on ${new Date(order.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {order.status && <StatusBadge status={order.status} />}
                </div>
              </div>{" "}
              {/* Order Items */}
              <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-6 shadow-md backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
                  Items
                </h2>

                <div className="space-y-4">
                  {order.OrderItem?.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex flex-col py-3 border-b border-[var(--border)] last:border-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div
                          className="relative w-full sm:w-[26rem] lg:w-[30rem] aspect-video rounded-xl overflow-hidden border border-[var(--border)]"
                          onMouseEnter={() => setHoveredPreviewId(item.product.id)}
                          onMouseLeave={() => setHoveredPreviewId((prev) => (prev === item.product.id ? null : prev))}
                        >
                          <div
                            className="pointer-events-none absolute inset-0 scale-140 saturate-120 blur-[3px] bg-cover bg-center"
                            style={{ backgroundImage: "url('/mc_bg.webp')" }}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),rgba(0,0,0,0.28))]" />
                          <div className="absolute inset-0">
                            <ProductCapeViewer
                              texturePath={`/cape renders/${("slug" in item.product ? item.product.slug : null) || "experience"}.png`}
                              compact
                              variant="shop-card"
                              isHovered={hoveredPreviewId === item.product.id}
                            />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-medium text-[var(--foreground)]">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[var(--foreground)]">
                            {formatPrice(item.price)}
                          </p>
                          <p className="text-sm text-[var(--primary)]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Show codes only for PAID or DELIVERED orders */}
                      {(order.status === "PAID" ||
                        order.status === "DELIVERED") &&
                        item.codes &&
                        Array.isArray(item.codes) &&
                        item.codes.length > 0 && (
                          <div className="mt-4 w-full">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-sm text-[var(--foreground)]">
                                Your Code{item.codes.length > 1 ? "s" : ""}:
                              </h4>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  copyToClipboard(item.codes.join("\n"))
                                }
                                className="flex items-center px-2 py-1 text-xs bg-[color-mix(in_srgb,var(--primary),#fff_90%)] text-[var(--primary)] rounded"
                              >
                                {copiedCode === item.codes.join("\n")
                                  ? "Copied All!"
                                  : "Copy All"}
                                <FaCopy className="ml-1" />
                              </motion.button>
                            </div>
                            <div className="bg-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] rounded-md p-3 overflow-x-auto">
                              {item.codes.map((code: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between mb-2 last:mb-0"
                                >
                                  <pre
                                    className="text-sm font-mono text-[var(--foreground)] cursor-pointer flex-grow px-2 py-1 rounded hover:bg-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]"
                                    onClick={() => copyToClipboard(code)}
                                    title="Click to copy"
                                  >
                                    {code}
                                  </pre>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => copyToClipboard(code)}
                                    className="ml-2 p-1 text-xs text-[var(--primary)] rounded hover:bg-[color-mix(in_srgb,var(--primary),#fff_90%)]"
                                    title="Copy code"
                                  >
                                    {copiedCode === code ? (
                                      <FaCheck className="text-green-500" />
                                    ) : (
                                      <FaCopy />
                                    )}
                                  </motion.button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Show message when codes are not available due to payment status */}
                      {(order.status === "PENDING" ||
                        order.status === "CANCELLED") && (
                        <div className="mt-4 w-full">
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                            <div className="flex items-center">
                              <FaClock className="text-yellow-500 mr-2" />
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {order.status === "PENDING"
                                  ? "Your code will be available once payment is confirmed."
                                  : "This order has been cancelled. Codes are not available."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              {/* Order Summary */}
              <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-6 shadow-md backdrop-blur-sm sticky top-6">
                <h2 className="text-xl font-bold mb-4 text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                  Order Summary
                </h2>{" "}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">
                      Subtotal
                    </span>
                    <span className="text-[var(--foreground)]">
                      {order.totalPrice ? formatPrice(order.totalPrice) : "N/A"}
                    </span>
                  </div>

                  {order.couponUsed && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount ({order.couponUsed})</span>
                      <span>
                        -
                        {order.discountAmount
                          ? formatPrice(order.discountAmount)
                          : "N/A"}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">
                      Payment Fee{" "}
                      {order.paymentType
                        ? `(${formatFeePercentage(order.paymentType)})`
                        : ""}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {order.paymentFee ? formatPrice(order.paymentFee) : "N/A"}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border)]">
                    <div className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">
                        Total
                      </span>
                      <span className="font-bold text-[var(--primary)]">
                        {formatPrice(finalPrice)}
                      </span>
                    </div>
                  </div>
                </div>{" "}
                {/* Payment Method */}
                <div className="pt-3 border-t border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                    Payment Method
                  </p>
                  <p className="text-[var(--color-text-secondary)]">
                    {order.paymentType
                      ? order.paymentType.replace("_", " ")
                      : "N/A"}
                    {order.paymentType === "CRYPTO" &&
                      walletDetails?.chain &&
                      ` (${walletDetails.chain})`}
                  </p>
                </div>
                {/* Customer Info */}
                {order.customer && (
                  <div className="pt-3 mt-3 border-t border-[var(--border)]">
                    <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                      Customer
                    </p>
                    <p className="text-[var(--color-text-secondary)]">
                      {order.customer.name}
                    </p>
                    <p className="text-[var(--color-text-secondary)]">
                      {order.customer.email}
                    </p>
                  </div>
                )}
                <Link href="/shop">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-lg font-medium"
                  >
                    Continue Shopping
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">
                <span className="gradient-text">
                  Frequently Asked Questions
                </span>
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Find answers to common questions about our services
              </p>
            </div>
            <FAQSection showTitle={false} showContactButtons={true} />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default OrderPage;

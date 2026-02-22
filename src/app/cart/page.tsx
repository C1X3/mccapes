"use client";

import React, { useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaCreditCard,
  FaBitcoin,
  FaPaypal,
  FaMoneyBillWave,
  FaArrowLeft,
  FaEthereum,
} from "react-icons/fa";
import { SiLitecoin, SiSolana } from "react-icons/si";
import Link from "next/link";
import { formatPrice } from "@/utils/formatting";
import Footer from "@/components/Footer";
import ProductCapeViewer from "@/components/ProductCapeViewer";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useTRPC } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import { CryptoType, PaymentType } from "@generated/browser";
import { useRouter } from "next/navigation";
import {
  formatFeePercentage,
  calculatePaymentFee,
  calculateTotalWithFee,
} from "@/utils/fees";
import {
  getProductBackgroundBlurClasses,
  isCapeProduct,
  resolveCapeTexturePath,
  resolveProductBackgroundImage,
} from "@/utils/productMedia";

const CartPage = () => {
  const router = useRouter();
  const trpc = useTRPC();

  const {
    items,
    totalItems,
    totalPrice,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    coupon: couponCode,
    discountAmount,
    discountedTotal,
    applyCoupon,
    removeCoupon,
    isCouponLoading,
  } = useCart();

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showCryptoOptions, setShowCryptoOptions] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    discord: "",
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>(
    PaymentType.STRIPE,
  );
  const [cryptoType, setCryptoType] = useState<CryptoType>(CryptoType.BITCOIN);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string | null>(null);

  const paymentFee = useMemo(
    () => calculatePaymentFee(paymentType, discountedTotal),
    [paymentType, discountedTotal],
  );
  const totalWithFee = useMemo(
    () => calculateTotalWithFee(paymentType, discountedTotal),
    [paymentType, discountedTotal],
  );

  const processPaymentMutation = useMutation(
    trpc.checkout.processPayment.mutationOptions({
      onSuccess: (data) => {
        if (
          data.success &&
          (data.paymentType === PaymentType.PAYPAL ||
            data.paymentType === PaymentType.CRYPTO)
        ) {
          toast.success("Redirecting to payment...");
          router.push(`/order/${data.orderId}`);
        } else if (
          data.success &&
          data.walletDetails.url &&
          data.paymentType !== PaymentType.CRYPTO
        ) {
          toast.success("Redirecting to payment...");
          window.location.href = data.walletDetails.url;
        }
      },
      onError: (error) => {
        toast.error(`Payment error: ${error.message}`);
        setShowPaymentOptions(true);
      },
    }),
  );

  const handlePaymentMethod = (method: PaymentType) => {
    setPaymentType(method);
    if (method === PaymentType.CRYPTO) {
      setShowCryptoOptions(true);
      setShowPaymentOptions(false);
    } else {
      setShowCustomerForm(true);
    }
  };

  const handleCryptoType = (type: CryptoType) => {
    setCryptoType(type);
    setShowCryptoOptions(false);
    setShowCustomerForm(true);
  };

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCustomerForm(false);

    toast.success(`Processing ${paymentType} payment...`);

    processPaymentMutation.mutate({
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name,
      })),
      customerInfo,
      paymentType,
      cryptoType: paymentType === PaymentType.CRYPTO ? cryptoType : undefined,
      totalPrice,
      paymentFee,
      couponCode,
      discountAmount,
    });

    clearCart();
  };

  // Handle applying coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput("");
    }
  };

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

  if (items.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--background)] flex flex-col">
        <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
        <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />
        <header className="relative z-10 py-8" />
        <div className="relative z-10 container mx-auto px-4 flex-grow">
          <div className="max-w-4xl mx-auto py-16">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
                Your Cart
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mx-auto rounded-full"></div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-12 text-center shadow-xl backdrop-blur-sm">
              <div className="mb-6 mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--surface),#000_8%)]">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 7.67V6.7C7.5 4.45 9.31 2.24 11.56 2.03C14.24 1.77 16.5 3.88 16.5 6.51V7.89"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.99 22H15.01C19.15 22 19.74 20.39 19.95 18.43L20.7 12.43C20.97 9.99 20.4 8 16 8H8C3.6 8 3.03 9.99 3.3 12.43L4.05 18.43C4.26 20.39 4.85 22 8.99 22Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.5 12H15.51"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 12H8.51"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
                Your cart is empty
              </h2>
              <p className="mb-8 text-[var(--color-text-secondary)]">
                Looks like you haven&apos;t added any items to your cart yet.
                <br />
                Explore our shop to find amazing products!
              </p>
              <Link href="/shop">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Browse Products
                </motion.button>
              </Link>
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
        <div className="max-w-7xl mx-auto py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              Your Cart
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mx-auto rounded-full"></div>
            <p className="mt-4 text-[var(--color-text-secondary)]">
              You have {totalItems} {totalItems === 1 ? "item" : "items"} in
              your cart
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl overflow-hidden border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] shadow-md backdrop-blur-sm"
                  >
                    <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div
                        className="relative w-full sm:w-[34rem] lg:w-[40rem] aspect-video rounded-xl overflow-hidden border border-[var(--border)]"
                        onMouseEnter={() => setHoveredPreviewId(item.product.id)}
                        onMouseLeave={() => setHoveredPreviewId((prev) => (prev === item.product.id ? null : prev))}
                      >
                        <div
                          className={`pointer-events-none absolute inset-0 bg-cover bg-center ${getProductBackgroundBlurClasses("default")}`}
                          style={{
                            backgroundImage: `url('${resolveProductBackgroundImage(item.product)}')`,
                          }}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),rgba(0,0,0,0.28))]" />
                        <div className="absolute inset-0">
                          {isCapeProduct(item.product) ? (
                            <ProductCapeViewer
                              texturePath={resolveCapeTexturePath(item.product)}
                              compact
                              variant="shop-card"
                              isHovered={hoveredPreviewId === item.product.id}
                            />
                          ) : (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex-grow sm:ml-2 w-full">
                        <h3 className="text-xl font-bold text-[var(--foreground)]">
                          {item.product.name}
                        </h3>
                        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                          {item.product.category}
                        </p>
                        <div className="mt-3 flex items-center">
                          <span className="text-[var(--primary)] font-bold text-lg">
                            {formatPrice(item.product.price)}
                          </span>
                          <span className="mx-2 text-[color-mix(in_srgb,var(--foreground),#888_60%)]">
                            ×
                          </span>
                          <span className="text-[var(--foreground)]">
                            {item.quantity}
                          </span>
                          <span className="ml-4 text-[var(--primary)] font-bold">
                            = {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center mt-4 sm:mt-0 sm:ml-4">
                        <div className="flex items-center mb-4 bg-[color-mix(in_srgb,var(--surface),#000_8%)] rounded-full p-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--primary)] rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <FaMinus size={10} />
                          </motion.button>

                          <span className="w-10 text-center text-[var(--foreground)] font-medium">
                            {item.quantity}
                          </span>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--primary)] rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.product.stock}
                          >
                            <FaPlus size={10} />
                          </motion.button>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-red-500 hover:text-red-600 bg-[color-mix(in_srgb,var(--surface),#000_8%)] p-2 rounded-full"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <FaTrash size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-between items-center">
                <Link href="/shop">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 19.9201L8.47997 13.4001C7.70997 12.6301 7.70997 11.3701 8.47997 10.6001L15 4.08008"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Continue Shopping
                  </motion.button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div
                className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-6 shadow-xl backdrop-blur-sm sticky top-6 overflow-hidden"
                style={{
                  minHeight:
                    showPaymentOptions || showCryptoOptions ? "480px" : "auto",
                }}
              >
                <motion.div
                  layout
                  transition={{
                    layout: { duration: 0.5, ease: [0.19, 1.0, 0.22, 1.0] },
                    height: { duration: 0.5 },
                  }}
                  style={{
                    minHeight:
                      showPaymentOptions || showCryptoOptions
                        ? "480px"
                        : "350px",
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {!showPaymentOptions &&
                    !showCryptoOptions &&
                    !showCustomerForm ? (
                      <motion.div
                        key="orderSummary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.19, 1.0, 0.22, 1.0],
                        }}
                      >
                        <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)] pb-2 border-b border-[var(--border)]">
                          Order Summary
                        </h2>

                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">
                              Subtotal
                            </span>
                            <span className="text-[var(--foreground)]">
                              {formatPrice(totalPrice)}
                            </span>
                          </div>

                          {couponCode && (
                            <div className="flex justify-between text-green-500">
                              <span className="flex items-center gap-2">
                                Discount ({couponCode})
                                <button
                                  onClick={removeCoupon}
                                  className="text-xs bg-success/10 text-success rounded-full px-2 py-0.5 hover:bg-success/20"
                                >
                                  Remove
                                </button>
                              </span>
                              <span>-{formatPrice(discountAmount)}</span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">
                              Payment Fee ({formatFeePercentage(paymentType)})
                            </span>
                            <span className="text-[var(--foreground)]">
                              {formatPrice(paymentFee)}
                            </span>
                          </div>
                          <div className="pt-3 mt-3 border-t border-[var(--border)]">
                            <div className="flex justify-between">
                              <span className="font-bold text-[var(--foreground)]">
                                Total
                              </span>
                              <span className="font-bold text-[var(--primary)]">
                                {formatPrice(totalWithFee)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!couponCode && (
                          <form onSubmit={handleApplyCoupon} className="mb-5">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                placeholder="Coupon code"
                                className="flex-1 p-3 rounded-lg bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)]"
                                disabled={isCouponLoading}
                              />
                              <motion.button
                                whileHover={{
                                  scale: !isCouponLoading ? 1.02 : 1,
                                }}
                                whileTap={{
                                  scale: !isCouponLoading ? 0.98 : 1,
                                }}
                                type="submit"
                                className="px-4 py-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[color-mix(in_srgb,var(--surface),#000_14%)]"
                                disabled={isCouponLoading}
                              >
                                {isCouponLoading ? (
                                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-[var(--primary)] animate-spin"></div>
                                ) : (
                                  "Apply"
                                )}
                              </motion.button>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                              From our promotions or social media.
                            </p>
                          </form>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowPaymentOptions(true)}
                          className="w-full py-4 bg-success text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                          Proceed to Checkout
                        </motion.button>

                        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
                          <p>We accept multiple payment methods</p>
                          <div className="flex justify-center items-center gap-3 mt-3">
                            <FaCreditCard size={16} />
                            <FaBitcoin size={16} />
                            <FaPaypal size={16} />
                            <FaMoneyBillWave size={16} />
                          </div>
                        </div>
                      </motion.div>
                    ) : showCustomerForm ? (
                      <motion.div
                        key="customerInfoForm"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.19, 1.0, 0.22, 1.0],
                        }}
                        className="h-full"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            Your Information
                          </h2>
                        </div>

                        <form
                          onSubmit={handleCustomerInfoSubmit}
                          className="space-y-4"
                        >
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-[var(--foreground)] mb-1"
                            >
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="name"
                              value={customerInfo.name}
                              onChange={(e) =>
                                setCustomerInfo({
                                  ...customerInfo,
                                  name: e.target.value,
                                })
                              }
                              className="w-full p-3 rounded-lg bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)]"
                              placeholder="John Doe"
                              required
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-[var(--foreground)] mb-1"
                            >
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={customerInfo.email}
                              onChange={(e) =>
                                setCustomerInfo({
                                  ...customerInfo,
                                  email: e.target.value,
                                })
                              }
                              className="w-full p-3 rounded-lg bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)]"
                              placeholder="john@example.com"
                              required
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-[var(--foreground)] mb-1"
                            >
                              Discord Username
                            </label>
                            <input
                              type="text"
                              id="discord"
                              value={customerInfo.discord}
                              onChange={(e) =>
                                setCustomerInfo({
                                  ...customerInfo,
                                  discord: e.target.value,
                                })
                              }
                              className="w-full p-3 rounded-lg bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--foreground)]"
                              placeholder="@JohnDoe"
                              required
                            />
                          </div>

                          <div className="flex items-start gap-3 mt-4">
                            <input
                              type="checkbox"
                              id="terms"
                              className="mt-1 w-4 h-4 rounded-md bg-[color-mix(in_srgb,var(--surface),#000_8%)] border border-[var(--border)] text-[var(--primary)]"
                              required
                              onChange={(e) =>
                                setTermsAccepted(e.target.checked)
                              }
                              checked={termsAccepted}
                            />
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              By continuing, you agree to our{" "}
                              <Link
                                href="/terms"
                                className="text-[var(--primary)] hover:text-[var(--secondary)]"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                href="/privacy"
                                className="text-[var(--primary)] hover:text-[var(--secondary)]"
                              >
                                Privacy Policy
                              </Link>
                              .
                            </p>
                          </div>

                          <motion.button
                            whileHover={{ scale: termsAccepted ? 1.02 : 1 }}
                            whileTap={{ scale: termsAccepted ? 0.98 : 1 }}
                            type="submit"
                            disabled={!termsAccepted}
                            className={`w-full py-4 mt-6 ${termsAccepted ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" : "bg-[color-mix(in_srgb,var(--foreground),var(--background)_80%)]"} text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed`}
                          >
                            Continue to Payment
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              setShowCustomerForm(false);
                              if (paymentType === PaymentType.CRYPTO) {
                                setShowCryptoOptions(true);
                              } else {
                                setShowPaymentOptions(true);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--surface),#000_14%)] transition-colors"
                          >
                            <FaArrowLeft />
                            Back to{" "}
                            {paymentType === PaymentType.CRYPTO
                              ? "Cryptocurrency Options"
                              : "Payment Methods"}
                          </motion.button>
                        </form>
                      </motion.div>
                    ) : showCryptoOptions ? (
                      <motion.div
                        key="cryptoOptions"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.19, 1.0, 0.22, 1.0],
                        }}
                        className="h-full"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            Select Cryptocurrency
                          </h2>
                        </div>

                        <div className="space-y-4 mb-6">
                          <motion.button
                            onClick={() => handleCryptoType(CryptoType.BITCOIN)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#f7931a] to-[#e7861a] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <FaBitcoin size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">
                                Bitcoin (BTC)
                              </span>
                              <span className="text-xs opacity-80">
                                Pay with Bitcoin
                              </span>
                            </div>
                          </motion.button>

                          <motion.button
                            onClick={() =>
                              handleCryptoType(CryptoType.ETHEREUM)
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#627eea] to-[#3c5fea] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <FaEthereum size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">
                                Ethereum (ETH)
                              </span>
                              <span className="text-xs opacity-80">
                                Pay with Ethereum
                              </span>
                            </div>
                          </motion.button>

                          <motion.button
                            onClick={() =>
                              handleCryptoType(CryptoType.LITECOIN)
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#b8b8b8] to-[#929292] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <SiLitecoin size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">
                                Litecoin (LTC)
                              </span>
                              <span className="text-xs opacity-80">
                                Pay with Litecoin
                              </span>
                            </div>
                          </motion.button>

                          <motion.button
                            onClick={() => handleCryptoType(CryptoType.SOLANA)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <SiSolana size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">
                                Solana (SOL)
                              </span>
                              <span className="text-xs opacity-80">
                                Pay with Solana
                              </span>
                            </div>
                          </motion.button>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.55 }}
                          className="mt-6"
                        >
                          <motion.button
                            onClick={() => {
                              setShowCryptoOptions(false);
                              setShowPaymentOptions(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--surface),#000_14%)] transition-colors"
                          >
                            <FaArrowLeft />
                            Back to Payment Methods
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="paymentOptions"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.19, 1.0, 0.22, 1.0],
                        }}
                        className="h-full"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            Select Payment Method
                          </h2>
                        </div>

                        <div className="space-y-4 mb-6">
                          <motion.button
                            onClick={() =>
                              handlePaymentMethod(PaymentType.STRIPE)
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#6772e5] to-[#4f56d1] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <FaCreditCard size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">
                                Credit/Debit Card
                              </span>
                              <span className="text-xs opacity-80">
                                Pay with Stripe (
                                {formatFeePercentage(PaymentType.STRIPE)} fee)
                              </span>
                            </div>
                          </motion.button>

                          <motion.button
                            onClick={() =>
                              handlePaymentMethod(PaymentType.CRYPTO)
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#f7931a] to-[#e7861a] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <FaBitcoin size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">
                                Cryptocurrency
                              </span>
                              <span className="text-xs opacity-80">
                                BTC, ETH, LTC, SOL (
                                {formatFeePercentage(PaymentType.CRYPTO)} fee)
                              </span>
                            </div>
                          </motion.button>

                          <motion.button
                            onClick={() =>
                              handlePaymentMethod(PaymentType.PAYPAL)
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-gradient-to-r from-[#0070ba] to-[#1546a0] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                          >
                            <FaPaypal size={24} />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold">PayPal</span>
                              <span className="text-xs opacity-80">
                                Friends & Family (
                                {formatFeePercentage(PaymentType.PAYPAL)} fee)
                              </span>
                            </div>
                          </motion.button>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.65 }}
                          className="mt-6"
                        >
                          <motion.button
                            onClick={() => setShowPaymentOptions(false)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[color-mix(in_srgb,var(--surface),#000_8%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--surface),#000_14%)] transition-colors"
                          >
                            <FaArrowLeft />
                            Back to Order Summary
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default CartPage;

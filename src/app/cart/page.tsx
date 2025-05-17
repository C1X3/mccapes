"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrash, FaMinus, FaPlus, FaCreditCard, FaBitcoin, FaPaypal, FaTimes, FaMoneyBillWave } from "react-icons/fa";
import Link from "next/link";
import { formatPrice } from "@/utils/formatting";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-hot-toast";

const CartPage = () => {
    const { items, totalItems, totalPrice, isLoading, updateQuantity, removeItem } = useCart();
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    // Payment method handling
    const handlePaymentMethod = (method: string) => {
        toast.success(`Processing ${method} payment...`);
        setIsCheckoutModalOpen(false);
        // In a real app, you would redirect to the payment processor or handle the payment here
    };

    // Checkout modal component
    const CheckoutModal = () => (
        <AnimatePresence>
            {isCheckoutModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[var(--background)] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_80%)]"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">
                                Select Payment Method
                            </h2>
                            <button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--background),#333_15%)] transition-colors"
                            >
                                <FaTimes size={20} className="text-[var(--foreground)]" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <motion.button
                                onClick={() => handlePaymentMethod("Stripe")}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-4 bg-gradient-to-r from-[#6772e5] to-[#4f56d1] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                            >
                                <FaCreditCard size={24} />
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">Credit/Debit Card</span>
                                    <span className="text-xs opacity-80">Pay with Stripe</span>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => handlePaymentMethod("Crypto")}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-4 bg-gradient-to-r from-[#f7931a] to-[#e7861a] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                            >
                                <FaBitcoin size={24} />
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">Cryptocurrency</span>
                                    <span className="text-xs opacity-80">Bitcoin, Ethereum, etc.</span>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => handlePaymentMethod("PayPal")}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-4 bg-gradient-to-r from-[#0070ba] to-[#1546a0] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                            >
                                <FaPaypal size={24} />
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">PayPal</span>
                                    <span className="text-xs opacity-80">Friends & Family</span>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => handlePaymentMethod("Cash App")}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-4 bg-gradient-to-r from-[#00D632] to-[#00B828] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                            >
                                <FaMoneyBillWave size={24} />
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">Cash App</span>
                                    <span className="text-xs opacity-80">Quick mobile payment</span>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => handlePaymentMethod("Venmo")}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-4 bg-gradient-to-r from-[#3D95CE] to-[#008CFF] text-white rounded-xl flex items-center gap-4 transition-colors hover:shadow-lg"
                            >
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M17.448 5c-.636 2.006-1.556 3.76-2.73 5.568-.636.943-2.03 3.288-2.346 3.76-.318-.59-1.431-3.406-1.749-4.23-.445-1.236-.445-1.708-.318-2.652h-3.18C6.89 9.186 7.78 11.427 9 14.31c.382.96.89 1.708 1.43 2.18.7.59 1.493.707 2.13.352.636-.354 2.408-2.415 3.34-3.76 1.176-1.767 2.323-4.111 2.902-6.045.127-.471.318-1.061.763-2.002L17.447 5z"></path>
                                </svg>
                                <div className="flex flex-col text-left">
                                    <span className="font-semibold">Venmo</span>
                                    <span className="text-xs opacity-80">Simple social payments</span>
                                </div>
                            </motion.button>
                        </div>

                        <div className="flex justify-end">
                            <motion.button
                                onClick={() => setIsCheckoutModalOpen(false)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] rounded-xl hover:bg-[color-mix(in_srgb,var(--background),#333_25%)] transition-colors"
                            >
                                Cancel
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-[var(--background)]">
                <header className="py-8">
                    <Navbar />
                </header>
                <div className="container mx-auto px-4 flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-[var(--background)]">
                <header className="py-8">
                    <Navbar />
                </header>
                <div className="container mx-auto px-4 flex-grow">
                    <div className="max-w-4xl mx-auto py-16">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Your Cart</h1>
                            <div className="h-1 w-20 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mx-auto rounded-full"></div>
                        </div>

                        <div className="bg-gradient-to-b from-[color-mix(in_srgb,var(--background),#333_10%)] to-[var(--background)] rounded-2xl p-12 text-center border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] shadow-xl backdrop-blur-sm">
                            <div className="mb-6 mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--background),#333_15%)]">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.5 7.67V6.7C7.5 4.45 9.31 2.24 11.56 2.03C14.24 1.77 16.5 3.88 16.5 6.51V7.89" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8.99 22H15.01C19.15 22 19.74 20.39 19.95 18.43L20.7 12.43C20.97 9.99 20.4 8 16 8H8C3.6 8 3.03 9.99 3.3 12.43L4.05 18.43C4.26 20.39 4.85 22 8.99 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15.5 12H15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8.5 12H8.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">Your cart is empty</h2>
                            <p className="mb-8 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                Looks like you haven&apos;t added any items to your cart yet.<br />
                                Explore our shop to find amazing products!
                            </p>
                            <Link href="/shop">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-xl hover:shadow-lg transition-all"
                                >
                                    Browse Products
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[var(--background)]">
            <CheckoutModal />

            <header className="py-8">
                <Navbar />
            </header>

            <div className="container mx-auto px-4 flex-grow">
                <div className="max-w-7xl mx-auto py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">Your Cart</h1>
                        <div className="h-1 w-20 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mx-auto rounded-full"></div>
                        <p className="mt-4 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                            You have {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
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
                                        className="bg-gradient-to-b from-[color-mix(in_srgb,var(--background),#333_10%)] to-[var(--background)] rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] shadow-md backdrop-blur-sm"
                                    >
                                        <div className="p-6 flex flex-col sm:flex-row items-center">
                                            <div className="flex-shrink-0 w-28 h-28 mb-4 sm:mb-0 relative rounded-xl overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--primary),#fff_95%)] to-[color-mix(in_srgb,var(--secondary),#fff_95%)]">
                                                <Image
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    fill
                                                    className="object-contain p-2 drop-shadow-[0_5px_10px_rgba(0,0,0,0.2)]"
                                                />
                                            </div>

                                            <div className="flex-grow sm:ml-6">
                                                <h3 className="text-xl font-bold text-[var(--foreground)]">{item.product.name}</h3>
                                                <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mt-1">
                                                    {item.product.category}
                                                </p>
                                                <div className="mt-3 flex items-center">
                                                    <span className="text-[var(--primary)] font-bold text-lg">
                                                        {formatPrice(item.product.price)}
                                                    </span>
                                                    <span className="mx-2 text-[color-mix(in_srgb,var(--foreground),#888_60%)]">×</span>
                                                    <span className="text-[var(--foreground)]">{item.quantity}</span>
                                                    <span className="ml-4 text-[var(--primary)] font-bold">
                                                        = {formatPrice(item.product.price * item.quantity)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center mt-4 sm:mt-0 sm:ml-4">
                                                <div className="flex items-center mb-4 bg-[color-mix(in_srgb,var(--background),#333_15%)] rounded-full p-1">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="w-8 h-8 flex items-center justify-center text-[color-mix(in_srgb,var(--foreground),#888_40%)] hover:text-[var(--primary)] rounded-full"
                                                        onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
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
                                                        className="w-8 h-8 flex items-center justify-center text-[color-mix(in_srgb,var(--foreground),#888_40%)] hover:text-[var(--primary)] rounded-full"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <FaPlus size={10} />
                                                    </motion.button>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="text-red-500 hover:text-red-600 bg-[color-mix(in_srgb,var(--background),#333_15%)] p-2 rounded-full"
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
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 19.9201L8.47997 13.4001C7.70997 12.6301 7.70997 11.3701 8.47997 10.6001L15 4.08008" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Continue Shopping
                                    </motion.button>
                                </Link>
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-gradient-to-b from-[color-mix(in_srgb,var(--background),#333_10%)] to-[var(--background)] rounded-xl p-6 sticky top-6 border border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)] shadow-xl backdrop-blur-sm">
                                <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)] pb-2 border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                                    Order Summary
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">Subtotal</span>
                                        <span className="text-[var(--foreground)] font-medium">{formatPrice(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">Shipping</span>
                                        <span className="text-green-500 font-medium">Free</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">Tax</span>
                                        <span className="text-[var(--foreground)] font-medium">{formatPrice(totalPrice * 0.0725)}</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_90%)]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-[var(--foreground)]">Total</span>
                                            <div className="text-right">
                                                <span className="block text-xl font-bold text-[var(--primary)]">
                                                    {formatPrice(totalPrice + (totalPrice * 0.0725))}
                                                </span>
                                                <span className="text-xs text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                                    Including VAT
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsCheckoutModalOpen(true)}
                                    className="w-full py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                                >
                                    Proceed to Checkout
                                </motion.button>

                                <div className="mt-6 text-center text-sm text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                    <p>We accept multiple payment methods</p>
                                    <div className="flex justify-center items-center gap-3 mt-3">
                                        <FaCreditCard size={16} />
                                        <FaBitcoin size={16} />
                                        <FaPaypal size={16} />
                                        <FaMoneyBillWave size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default CartPage;

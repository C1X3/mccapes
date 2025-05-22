"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    CartItem,
    Product,
    getCart,
    saveCart,
    updateCartExpiration,
    clearCart as clearLocalStorageCart
} from '@/utils/cart';
import toast from 'react-hot-toast';
import { useTRPC } from '@/server/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CouponType } from '@generated';

type CartContextType = {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    isLoading: boolean;
    coupon: string | null;
    discountAmount: number;
    discountedTotal: number;
    isCouponLoading: boolean;
    addItem: (product: Product, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    applyCoupon: (code: string) => void;
    removeCoupon: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const trpc = useTRPC();
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [coupon, setCoupon] = useState<string | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const { mutateAsync: validateCoupon, isPending: isCouponLoading } = useMutation(trpc.coupon.validateCoupon.mutationOptions());

    // Initialize cart from localStorage
    useEffect(() => {
        const loadCart = () => {
            const storedCart = getCart();
            setItems(storedCart?.items || []);

            // Load coupon data if available
            if (storedCart?.coupon) {
                setCoupon(storedCart.coupon);
                setDiscountAmount(storedCart.discountAmount || 0);
            }

            setIsLoading(false);
        };

        loadCart();
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        // Skip during initial loading
        if (isLoading) return;

        saveCart(items, coupon, discountAmount);
    }, [items, coupon, discountAmount, isLoading]);

    // Calculate total items
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);

    // Calculate total price
    const totalPrice = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );

    // Calculate discounted total
    const discountedTotal = Math.max(0, totalPrice - discountAmount);

    // Add item to cart
    const addItem = (product: Product, quantity = 1) => {
        const idx = items.findIndex(item => item.product.id === product.id);
        const currentQty = idx >= 0 ? items[idx].quantity : 0;

        if (currentQty + quantity > product.stock) {
            const available = product.stock - currentQty;
            toast.error(
                available > 0
                    ? `Only ${available} more "${product.name}" in stock.`
                    : `"${product.name}" is out of stock.`
            );
            return;
        }

        const newItems: CartItem[] =
            idx >= 0
                ? items.map((item, i) =>
                    i === idx ? { ...item, quantity: item.quantity + quantity } : item
                )
                : [...items, { id: `${product.id}-${Date.now()}`, product, quantity }];

        setItems(newItems);

        toast.success(`Added x${quantity} "${product.name}" to cart`);
        updateCartExpiration();
    };

    // Update item quantity (with stock check)
    const updateQuantity = (productId: string, quantity: number) => {
        // find the item index
        const idx = items.findIndex(item => item.product.id === productId);

        // nothing to do if not found
        if (idx < 0) return;

        const currentItem = items[idx];
        const maxStock = currentItem.product.stock;

        // invalid quantity or exceeding stock?
        if (quantity <= 0) {
            // you might choose to remove the item here instead:
            // return removeItem(productId);
            return;
        }
        if (quantity > maxStock) {
            const available = maxStock;
            toast.error(
                available > 0
                    ? `Only ${available} "${currentItem.product.name}" in stock.`
                    : `"${currentItem.product.name}" is out of stock.`
            );
            return;
        }

        // build the new array just once
        const newItems = items.map(item =>
            item.product.id === productId
                ? { ...item, quantity }
                : item
        );

        setItems(newItems);
        updateCartExpiration();
    };

    // Remove item from cart
    const removeItem = (productId: string) => {
        // filter out the one item
        const newItems = items.filter(item => item.product.id !== productId);

        // if length didn't change, nothing to do
        if (newItems.length === items.length) return;

        setItems(newItems);
        updateCartExpiration();
    };

    // Clear cart
    const clearCart = () => {
        setItems([]);
        setCoupon(null);
        setDiscountAmount(0);
        clearLocalStorageCart();
    };

    // Apply coupon
    const applyCoupon = useCallback(async (code: string) => {
        if (!code.trim()) return

        try {
            const coupon = await validateCoupon({ code: code.trim() });
            if (!coupon) {
                throw new Error('Invalid coupon code')
            }

            // then apply exactly the same discount logic:
            let discount = 0
            if (coupon.type === CouponType.PERCENTAGE) {
                discount = totalPrice * (coupon.discount / 100)
            } else {
                discount = Math.min(coupon.discount, totalPrice)
            }
            setCoupon(coupon.code)
            setDiscountAmount(discount)

            const discountText =
                coupon.type === CouponType.PERCENTAGE
                    ? `${coupon.discount}%`
                    : `$${coupon.discount.toFixed(2)}`
            toast.success(`Coupon "${coupon.code}" applied! You saved ${discountText}`)
        } catch (err: any) {
            toast.error(err.message ?? 'Invalid coupon code')
        }
    }, [trpc, totalPrice]);

    // Remove coupon
    const removeCoupon = () => {
        setCoupon(null);
        setDiscountAmount(0);
        toast.success('Coupon removed');
    };

    // Context value
    const value = {
        items,
        totalItems,
        totalPrice,
        isLoading,
        coupon,
        discountAmount,
        discountedTotal,
        isCouponLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
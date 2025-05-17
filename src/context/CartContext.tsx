"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    CartItem,
    Product,
    getCart,
    saveCart,
    updateCartExpiration,
    clearCart as clearLocalStorageCart
} from '@/utils/cart';

type CartContextType = {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    isLoading: boolean;
    addItem: (product: Product, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
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
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize cart from localStorage
    useEffect(() => {
        const loadCart = () => {
            const storedCart = getCart();
            setItems(storedCart?.items || []);
            setIsLoading(false);
        };

        loadCart();
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        // Skip during initial loading
        if (isLoading) return;

        saveCart(items);
    }, [items, isLoading]);

    // Calculate total items
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);

    // Calculate total price
    const totalPrice = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );

    // Add item to cart
    const addItem = (product: Product, quantity = 1) => {
        setItems(currentItems => {
            // Update cart expiration
            updateCartExpiration();

            // Check if item already exists
            const existingItemIndex = currentItems.findIndex(item => item.product.id === product.id);

            if (existingItemIndex >= 0) {
                // Update quantity of existing item
                const newItems = [...currentItems];
                newItems[existingItemIndex].quantity += quantity;
                return newItems;
            } else {
                // Add new item
                return [...currentItems, {
                    id: `${product.id}-${Date.now()}`,
                    product,
                    quantity,
                }];
            }
        });
    };

    // Update item quantity
    const updateQuantity = (productId: string, quantity: number) => {
        setItems(currentItems => {
            // Update cart expiration
            updateCartExpiration();

            // Find the item
            const existingItemIndex = currentItems.findIndex(item => item.product.id === productId);

            if (existingItemIndex >= 0 && quantity > 0) {
                // Update quantity
                const newItems = [...currentItems];
                newItems[existingItemIndex].quantity = quantity;
                return newItems;
            }

            return currentItems;
        });
    };

    // Remove item from cart
    const removeItem = (productId: string) => {
        setItems(currentItems => {
            // Update cart expiration
            updateCartExpiration();

            // Filter out the item
            return currentItems.filter(item => item.product.id !== productId);
        });
    };

    // Clear cart
    const clearCart = () => {
        setItems([]);
        // Remove from localStorage
        clearLocalStorageCart();
    };

    // Context value
    const value = {
        items,
        totalItems,
        totalPrice,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
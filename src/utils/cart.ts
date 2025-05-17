/**
 * Cart utilities for localStorage operations with expiration
 */

// Constants
export const CART_STORAGE_KEY = 'mccapes-cart';
export const CART_EXPIRATION_TIME = 60 * 60 * 1000; // 60 minutes in milliseconds

// Types
export type Product = {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
};

export type CartItem = {
    id: string;
    product: Product;
    quantity: number;
};

export type StoredCart = {
    items: CartItem[];
    expiration: number; // timestamp in milliseconds
};

/**
 * Gets the cart from localStorage
 */
export function getCart(): StoredCart | null {
    try {
        if (typeof window === 'undefined') return null;

        const storedCartJson = localStorage.getItem(CART_STORAGE_KEY);
        if (!storedCartJson) return null;

        const storedCart: StoredCart = JSON.parse(storedCartJson);

        // Check if cart has expired
        if (storedCart.expiration > Date.now()) {
            return storedCart;
        } else {
            // Clear expired cart
            localStorage.removeItem(CART_STORAGE_KEY);
            return null;
        }
    } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        return null;
    }
}

/**
 * Saves the cart to localStorage with a new expiration
 */
export function saveCart(items: CartItem[]): void {
    try {
        if (typeof window === 'undefined') return;

        const storedCart: StoredCart = {
            items,
            expiration: Date.now() + CART_EXPIRATION_TIME
        };

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart));
    } catch (error) {
        console.error("Error saving cart to localStorage:", error);
    }
}

/**
 * Updates the cart expiration time
 */
export function updateCartExpiration(): void {
    try {
        if (typeof window === 'undefined') return;

        const storedCartJson = localStorage.getItem(CART_STORAGE_KEY);

        if (storedCartJson) {
            const storedCart: StoredCart = JSON.parse(storedCartJson);
            storedCart.expiration = Date.now() + CART_EXPIRATION_TIME;
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart));
        }
    } catch (error) {
        console.error("Error updating cart expiration:", error);
    }
}

/**
 * Clears the cart from localStorage
 */
export function clearCart(): void {
    try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing cart from localStorage:", error);
    }
} 
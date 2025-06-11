export interface LineItem {
    productId: string;
    quantity: number;
    price: number;
    name: string;
}

export interface CheckoutPayload {
    orderId: string;
    items: LineItem[];
    customerInfo: {
        name: string;
        email: string;
    };
    totalPrice: number;
    couponCode: string | null;
    discountAmount: number;
    paymentFee: number;
}

export interface WalletDetails {
    address: string;
    amount: string;
    url: string;
    note?: string;
}
import axios from 'axios';

interface LineItem {
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
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<string> {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.commerce.coinbase.com/charges',
            headers: {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': process.env.COINBASE_API_KEY,
                'X-CC-Version': '2018-03-22',
            },
            data: {
                name: 'MCCapes Store Order',
                description: `Order #${payload.orderId}`,
                pricing_type: 'fixed_price',
                local_price: {
                    amount: payload.totalPrice.toFixed(2),
                    currency: 'USD',
                },
                metadata: {
                    orderId: payload.orderId,
                    customer_email: payload.customerInfo.email,
                    customer_name: payload.customerInfo.name,
                },
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?success=true`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?canceled=true`,
            },
        });

        // Return the hosted URL for the charge
        return response.data.data.hosted_url;
    } catch (error) {
        console.error('Coinbase Commerce checkout error:', error);
        throw new Error('Failed to create Coinbase Commerce checkout session');
    }
}

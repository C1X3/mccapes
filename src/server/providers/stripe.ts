import { Stripe } from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: payload.items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe uses cents
                },
                quantity: item.quantity,
            })),
            customer_email: payload.customerInfo.email,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?canceled=true`,
            metadata: {
                orderId: payload.orderId,
            },
        });

        return session.url || '';
    } catch (error) {
        console.error('Stripe checkout error:', error);
        throw new Error('Failed to create Stripe checkout session');
    }
}

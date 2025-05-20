import { Stripe } from 'stripe';
import { CheckoutPayload } from './types';
import { calculatePaymentFee, formatFeePercentage } from '@/utils/fees';
import { PaymentType } from '@generated';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function createCheckoutSession(payload: CheckoutPayload): Promise<string> {
    try {
        // Calculate subtotal and fee
        const subtotal = payload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const paymentFee = calculatePaymentFee(PaymentType.STRIPE, subtotal);
        const feePercentageText = formatFeePercentage(PaymentType.STRIPE);
        
        // Create line items for products
        const productLineItems = payload.items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));
        
        // Add a fee line item
        const feeLineItem = {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Processing Fee (${feePercentageText})`,
                },
                unit_amount: Math.round(paymentFee * 100),
            },
            quantity: 1,
        };
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [...productLineItems, feeLineItem],
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

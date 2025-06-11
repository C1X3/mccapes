import { Stripe } from 'stripe';
import { CheckoutPayload } from './types';
import { formatFeePercentage } from '@/utils/fees';
import { PaymentType } from '@generated';
import { prisma } from '@/utils/prisma';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function getOrCreateProduct(item: {
    productId: string
    name: string
    price: number
}) {
    // 1) Look up in your local database
    let dbProduct = await prisma.product.findUnique({
        where: { id: item.productId },
    });

    // 1a) If it doesn’t exist in your DB, create it now.
    if (!dbProduct) throw new Error('Product not found');

    // 2) If there’s already a stripeId in the DB, try to retrieve it from Stripe
    if (dbProduct.stripeId) {
        try {
            const existing = await stripe.products.retrieve(dbProduct.stripeId);

            // If Stripe returns an inactive product, reactivate it:
            if (!existing.active) {
                await stripe.products.update(dbProduct.stripeId, { active: true });
            }

            // Return the still-valid Stripe product ID
            return dbProduct.stripeId;
        } catch {
            const newProduct = await stripe.products.create({
                name: item.name,
                description:
                    'For buying this service, you will be added to the MC Tournaments server where you will have an opportunity to win fun prizes … (etc)',
                metadata: { productId: dbProduct.id },
            });

            dbProduct = await prisma.product.update({
                where: { id: dbProduct.id },
                data: { stripeId: newProduct.id },
            });

            return newProduct.id;
        }
    }

    // 3) If we get here, dbProduct exists but has no stripeId – create it from scratch:
    const brandNew = await stripe.products.create({
        name: item.name,
        description:
            'For buying this service, you will be added to the MC Tournaments server where you will have an opportunity to win fun prizes … (etc)',
        metadata: { productId: dbProduct.id },
    });

    dbProduct = await prisma.product.update({
        where: { id: dbProduct.id },
        data: { stripeId: brandNew.id },
    });

    return brandNew.id;
}

async function getOrCreatePrice(productId: string, price: number) {
    // 1) List all active prices on this product
    const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
    });

    // 2) If none exist, create one and return its ID
    if (prices.data.length === 0) {
        const newPrice = await stripe.prices.create({
            product: productId,
            unit_amount: Math.round(price * 100),
            currency: 'usd',
        });
        return newPrice.id;
    }

    // 3) Try to find an existing Price whose amount ≈ `price`
    const matching = prices.data.find(p =>
        Math.abs((p.unit_amount ?? 0) / 100 - price) < 0.01
    );
    if (matching) {
        return matching.id;
    }

    // 4) If no match, create a fresh one and return its ID
    const created = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(price * 100),
        currency: 'usd',
    });
    return created.id;
}

async function getOrCreateStripeProduct(item: { productId: string; name: string; price: number; quantity: number }) {
    const stripeProductId = await getOrCreateProduct(item);
    const priceId = await getOrCreatePrice(stripeProductId, item.price);

    return {
        priceId,
        quantity: item.quantity,
    };
}

async function createOneTimeFixedAmountCoupon(
    amountOff: number,
    name?: string
): Promise<string> {
    if (amountOff <= 0) {
        throw new Error('Discount amount must be positive.');
    }

    try {
        const coupon = await stripe.coupons.create({
            amount_off: amountOff,
            currency: 'usd',
            duration: 'once',
            name: name || `Fixed Discount ${new Date().toISOString()}`,
        });
        return coupon.id;
    } catch (error) {
        console.error('Failed to create Stripe coupon:', error);
        throw new Error('Failed to create one-time coupon for discount.');
    }
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<string> {
    try {
        const feePercentageText = formatFeePercentage(PaymentType.STRIPE);

        // Build product line items with “price” instead of “priceId”
        const productLineItems = await Promise.all(
            payload.items.map(async (item) => {
                const { priceId, quantity } = await getOrCreateStripeProduct(item);
                return { price: priceId, quantity };
            })
        );

        // Start with product line items
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [...productLineItems];

        // Processing fee
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Processing Fee (${feePercentageText})`,
                },
                unit_amount: Math.round(payload.paymentFee * 100),
            },
            quantity: 1,
        });

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: payload.customerInfo.email,
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${payload.orderId}?canceled=true`,
            metadata: {
                orderId: payload.orderId,
                ...(payload.couponCode && { couponCode: payload.couponCode }), // Add if exists
                ...(payload.discountAmount && { discountAmountApplied: payload.discountAmount.toString() }), // Add if exists
            },
        };

        if (payload.discountAmount && payload.discountAmount > 0) {
            const discountAmountInCents = Math.round(payload.discountAmount * 100);
            const couponId = await createOneTimeFixedAmountCoupon(
                discountAmountInCents,
                payload.couponCode || `Order Discount for ${payload.orderId}`
            );
            sessionParams.discounts = [{ coupon: couponId }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return session.url || '';
    } catch (error) {
        console.error('Stripe checkout error:', error);
        throw new Error('Failed to create Stripe checkout session');
    }
}


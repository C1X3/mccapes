import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/server/providers/stripe';
import Stripe from 'stripe';
import { prisma } from '@/utils/prisma';
import { OrderStatus } from '@generated';
import { sendOrderCompleteEmail } from '@/utils/email';

export async function POST(request: Request) {
    const reqHeaders = await headers();
    const body = await request.text();

    let event: Stripe.Event | null = null;
    if (!body) {
        console.log('No event or body');
        return NextResponse.json({ error: 'No event or body' }, { status: 400 });
    }

    const signature = reqHeaders.get('stripe-signature');
    if (!signature) {
        console.log('No signature');
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    if (!event) {
        console.log('No event');
        return NextResponse.json({ error: 'No event' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const checkoutIntent = event.data.object;
            if (checkoutIntent.payment_status === 'paid') {
                if (!checkoutIntent.metadata?.orderId) {
                    console.log('No orderId in metadata');
                    return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
                }

                const orderId = checkoutIntent.metadata.orderId;

                const fullOrderDetails = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: {
                        customer: true,
                        OrderItem: {
                            include: {
                                product: true
                            }
                        }
                    }
                });

                if (!fullOrderDetails) {
                    console.log('No order found');
                    return NextResponse.json({ error: 'No order found' }, { status: 400 });
                }

                // Verify the payment amount matches the order total (with discount applied)
                const expectedTotal = fullOrderDetails.totalPrice + fullOrderDetails.paymentFee;
                const actualAmount = Number((checkoutIntent.amount_total || 0) / 100); // Stripe amounts are in cents

                if (Math.abs(actualAmount - expectedTotal) > 0.01) { // Allow for small rounding differences
                    console.log(`Payment amount mismatch: expected ${expectedTotal}, got ${actualAmount}`);
                    return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
                }

                await prisma.$transaction(async (tx) => {
                    const order = await tx.order.update({
                        where: { id: orderId },
                        data: { status: OrderStatus.PAID },
                        include: {
                            OrderItem: true
                        }
                    });

                    for (const item of order.OrderItem) {
                        const product = await prisma.product.findUnique({
                            where: { id: item.productId },
                            select: {
                                stock: true,
                            }
                        });

                        if (!product) continue;

                        if (product.stock.length < item.quantity) continue;

                        const oldestStock = product.stock.slice(0, item.quantity);
                        const filteredStock = product.stock.filter(stock => !oldestStock.includes(stock));
                        await prisma.product.update({
                            where: { id: item.productId },
                            data: { stock: filteredStock },
                        });

                        await prisma.orderItem.create({
                            data: {
                                orderId: order.id,
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                codes: oldestStock,
                            }
                        });
                    }
                });

                await sendOrderCompleteEmail({
                    customerName: fullOrderDetails.customer.name,
                    customerEmail: fullOrderDetails.customer.email,
                    orderId: fullOrderDetails.id,
                    totalPrice: fullOrderDetails.totalPrice,
                    paymentFee: fullOrderDetails.paymentFee,
                    totalWithFee: fullOrderDetails.totalPrice + fullOrderDetails.paymentFee,
                    paymentType: fullOrderDetails.paymentType,
                    orderDate: fullOrderDetails.createdAt.toISOString(),
                    items: fullOrderDetails.OrderItem.map(i => ({
                        name: i.product.name,
                        price: i.price,
                        quantity: i.quantity,
                        codes: i.codes,
                        image: i.product.image
                    }))
                });
            }

            console.log(`PaymentIntent for ${checkoutIntent.payment_status} was successful!`);
            break;
        case 'checkout.session.expired':
            const expiryIntent = event.data.object;

            if (!expiryIntent.metadata?.orderId) {
                console.log('No orderId in metadata');
                return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
            }

            const orderId = expiryIntent.metadata.orderId;

            await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CANCELLED },
            });

            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
}
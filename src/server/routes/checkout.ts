import { z } from 'zod';
import { prisma } from '@/utils/prisma';
import { baseProcedure, createTRPCRouter } from '../init';
import { TRPCError } from '@trpc/server';
import { CryptoType, OrderStatus, PaymentType } from '@generated';
import { createCheckoutSession as createStripeCheckout } from '../providers/stripe';
import { createCheckoutSession as createPaypalCheckout } from '../providers/paypal';
import { createWalletDetails as createCryptoCheckout } from '../providers/crypto';
import { WalletDetails } from '../providers/types';
import { calculatePaymentFee } from '@/utils/fees';
import { sendOrderPlacedEmail } from '@/utils/email';

export const checkoutRouter = createTRPCRouter({
    processPayment: baseProcedure
        .input(
            z.object({
                items: z.array(
                    z.object({
                        productId: z.string(),
                        quantity: z.number().int().positive(),
                        price: z.number().positive(),
                        name: z.string(),
                    })
                ),
                customerInfo: z.object({
                    name: z.string().min(1),
                    email: z.string().email(),
                }),
                paymentType: z.nativeEnum(PaymentType),
                cryptoType: z.nativeEnum(CryptoType).optional(),
                totalPrice: z.number().positive(),
            })
        )
        .mutation(async ({ input }) => {
            try {
                // Calculate subtotal and payment fee
                const subtotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const paymentFee = calculatePaymentFee(input.paymentType, subtotal);
                
                // 1. Create a pending order in the database
                const order = await prisma.order.create({
                    data: {
                        totalPrice: input.totalPrice,
                        paymentFee: paymentFee,
                        paymentType: input.paymentType,
                        status: OrderStatus.PENDING,
                        customer: {
                            create: {
                                name: input.customerInfo.name,
                                email: input.customerInfo.email,
                            }
                        },
                    }
                });

                // 2. Generate payment link based on the selected payment method
                let walletDetails: WalletDetails | undefined;

                const payloadForProviders = {
                    orderId: order.id,
                    items: input.items,
                    customerInfo: input.customerInfo,
                    totalPrice: input.totalPrice
                };

                switch (input.paymentType) {
                    case PaymentType.STRIPE:
                        walletDetails = {
                            amount: input.totalPrice.toFixed(2),
                            address: "",
                            url: await createStripeCheckout(payloadForProviders),
                        };
                        break;
                    case PaymentType.PAYPAL:
                        walletDetails = await createPaypalCheckout(payloadForProviders);
                        break;
                    case PaymentType.CRYPTO:
                        if (!input.cryptoType) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: 'Crypto type is required for crypto payments',
                            });
                        }

                        walletDetails = await createCryptoCheckout(payloadForProviders, input.cryptoType);
                        break;
                    // case PaymentType.CASH_APP:
                    //     // In a real implementation, you'd call Cash App API
                    //     paymentUrl = `https://cash.app/pay/${order.id}?redirect_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}`)}`;
                    //     break;
                    // case PaymentType.VENMO:
                    //     // In a real implementation, you'd call Venmo API
                    //     paymentUrl = `https://venmo.com/checkout/${order.id}?redirect_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}`)}`;
                    //     break;
                    default:
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Payment Method Coming Soon',
                        });
                }

                if (walletDetails) {
                    for (const item of input.items) {
                        const product = await prisma.product.findUnique({
                            where: { id: item.productId },
                            select: {
                                stock: true,
                            }
                        });

                        if (!product) {
                            throw new TRPCError({
                                code: 'NOT_FOUND',
                                message: 'Product not found',
                            });
                        }

                        if (product.stock.length < item.quantity) {
                            throw new TRPCError({
                                code: 'BAD_REQUEST',
                                message: 'Not enough stock for product',
                            });
                        }

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

                    await sendOrderPlacedEmail({
                        customerName: input.customerInfo.name,
                        customerEmail: input.customerInfo.email,
                        orderId: order.id,
                        items: input.items,
                        totalPrice: input.totalPrice,
                        paymentFee: paymentFee,
                        totalWithFee: input.totalPrice + paymentFee,
                        paymentType: input.paymentType,
                        paymentDetails: walletDetails,
                    });
                }

                return {
                    orderId: order.id,
                    paymentType: input.paymentType,
                    walletDetails,
                    success: true,
                };
            } catch (err) {
                console.error('Payment processing error:', err);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to process payment',
                });
            }
        }),

    getCryptoWalletDetails: baseProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ input }) => {
            const order = await prisma.order.findUnique({
                where: { id: input.orderId },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order not found',
                });
            }

            const wallet = await prisma.wallet.findFirst({
                where: { orderId: input.orderId },
                orderBy: { depositIndex: 'asc' },
            });

            if (!wallet) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Wallet not found',
                });
            }

            return wallet;
        }),

    getOrderStatus: baseProcedure
        .input(z.object({ orderId: z.string() }))
        .query(async ({ input }) => {
            const order = await prisma.order.findUnique({
                where: { id: input.orderId },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order not found',
                });
            }

            if (order.status === OrderStatus.PAID || order.status === OrderStatus.DELIVERED) {
                return prisma.order.findUnique({
                    where: { id: input.orderId },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        paymentType: true,
                        paymentFee: true,
                        totalPrice: true,
                        paypalNote: true,
                        OrderItem: {
                            include: {
                                product: true,
                            }
                        },
                        customer: true,
                    },
                });
            } else {
                return prisma.order.findUnique({
                    where: { id: input.orderId },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        paymentType: true,
                        paymentFee: true,
                        totalPrice: true,
                        paypalNote: true,
                        OrderItem: {
                            select: {
                                quantity: true,
                                price: true,
                                product: true,
                            }
                        },
                        customer: true
                    }
                });
            }
        }),

    updateOrderStatus: baseProcedure
        .input(
            z.object({
                orderId: z.string(),
                status: z.enum(['PENDING', 'PAID', 'DELIVERED', 'CANCELLED']),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const order = await prisma.order.update({
                    where: { id: input.orderId },
                    data: { status: input.status },
                });

                return { success: true, order };
            } catch {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to update order status',
                });
            }
        }),
}); 
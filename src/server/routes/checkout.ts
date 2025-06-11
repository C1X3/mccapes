import { z } from 'zod';
import { prisma } from '@/utils/prisma';
import { adminProcedure, baseProcedure, createTRPCRouter } from '../init';
import { TRPCError } from '@trpc/server';
import { CryptoType, OrderStatus, PaymentType } from '@generated';
import { createCheckoutSession as createStripeCheckout } from '../providers/stripe';
import { createCheckoutSession as createPaypalCheckout } from '../providers/paypal';
import { createWalletDetails as createCryptoCheckout } from '../providers/crypto';
import { WalletDetails } from '../providers/types';
import { sendOrderCompleteEmail } from '@/utils/email';
import { headers } from 'next/headers';

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
                    discord: z.string().optional(),
                }),
                paymentFee: z.number().positive(),
                paymentType: z.nativeEnum(PaymentType),
                cryptoType: z.nativeEnum(CryptoType).optional(),
                totalPrice: z.number().positive(),
                couponCode: z.string().nullable().optional(),
                discountAmount: z.number().optional(),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const reqHeaders = await headers();
                const ip = reqHeaders.get('CF-Connecting-IP') || reqHeaders.get('X-Forwarded-For') || reqHeaders.get('X-Real-IP');
                const userAgent = reqHeaders.get('User-Agent');

                // 1. Create a pending order in the database
                const order = await prisma.order.create({
                    data: {
                        totalPrice: input.totalPrice,
                        paymentFee: input.paymentFee,
                        paymentType: input.paymentType,
                        status: OrderStatus.PENDING,
                        couponUsed: input.couponCode || null,
                        discountAmount: input.discountAmount || 0,
                        customer: {
                            create: {
                                name: input.customerInfo.name,
                                email: input.customerInfo.email,
                                discord: input.customerInfo.discord,
                                ipAddress: ip,
                                useragent: userAgent,
                            }
                        },
                        OrderItem: {
                            create: input.items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                            }))
                        }
                    }
                });

                // 2. Generate payment link based on the selected payment method
                let walletDetails: WalletDetails | undefined;

                const payloadForProviders = {
                    orderId: order.id,
                    items: input.items,
                    customerInfo: input.customerInfo,
                    totalPrice: input.totalPrice,
                    couponCode: input.couponCode || null,
                    discountAmount: input.discountAmount || 0,
                    paymentFee: input.paymentFee,
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
                    default:
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'Payment Method Coming Soon',
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
                        couponUsed: true,
                        discountAmount: true,
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
                        couponUsed: true,
                        discountAmount: true,
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

    manuallyProcessInvoice: adminProcedure
        .input(z.object({ orderId: z.string() }))
        .mutation(async ({ input }) => {
            const order = await prisma.order.findUnique({
                where: { id: input.orderId },
                include: {
                    customer: true,
                    OrderItem: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order not found',
                });
            }

            for (const item of order.OrderItem) {
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

                await prisma.orderItem.update({
                    where: { id: item.id },
                    data: {
                        codes: item.codes.concat(oldestStock),
                    }
                });
            }

            await prisma.order.update({
                where: { id: input.orderId },
                data: { status: OrderStatus.PAID },
            });

            await sendOrderCompleteEmail({
                customerName: order.customer.name,
                customerEmail: order.customer.email,
                orderId: order.id,
                items: order.OrderItem.map(item => ({
                    name: item.product.name,
                    price: item.price,
                    quantity: item.quantity,
                    codes: item.codes,
                    image: item.product.image,
                })),
                totalPrice: order.totalPrice,
                paymentFee: order.paymentFee,
                totalWithFee: order.totalPrice + order.paymentFee,
                paymentType: order.paymentType,
                orderDate: order.createdAt.toISOString(),
            });

            return { success: true, order };
        }),

    cancelInvoice: adminProcedure
        .input(z.object({ orderId: z.string() }))
        .mutation(async ({ input }) => {
            // Fetch all orders, if it's stripe or paypal and lasts more than 30 minutes from created cancel the order
            const order = await prisma.order.findUnique({
                where: { id: input.orderId },
                include: {
                    OrderItem: true
                }
            });

            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order not found',
                });
            }

            await prisma.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.CANCELLED },
            });

            return { success: true, order };
        }),
}); 
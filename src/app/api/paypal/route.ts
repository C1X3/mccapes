import { parseIPN } from "@/types/paypal";
import { sendOrderCompleteEmail } from "@/utils/email";
import { prisma } from "@/utils/prisma";
import { OrderStatus, PaymentType } from "@generated";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.text();

    try {
        const payload = `cmd=_notify-validate&${body}`;
        const verificationResponse = await axios.post(
            'https://ipnpb.paypal.com/cgi-bin/webscr',
            payload,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                maxBodyLength: Infinity,  // in case your body is large
            }
        );

        if (verificationResponse.data !== 'VERIFIED') {
            return new NextResponse('OK', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    } catch (error) {
        console.error(error);
        return new NextResponse('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    const ipn = parseIPN(body);

    const order = await prisma.order.findFirst({
        where: {
            paypalNote: ipn.memo,
            status: OrderStatus.PENDING,
            paymentType: PaymentType.PAYPAL,
        },
        include: {
            customer: true,
            OrderItem: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!order) {
        return new NextResponse('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    // Calculate the expected amount with discount applied
    const expectedTotal = order.totalPrice + order.paymentFee - (order.discountAmount ?? 0);

    if (
        ipn.receiverEmail === process.env.NEXT_PUBLIC_PAYPAL_EMAIL &&
        ipn.paymentStatus === 'Completed' &&
        ipn.txnType === 'send_money' &&
        ipn.paymentType === 'instant' &&
        ipn.mcCurrency === 'USD' &&
        ipn.mcGross >= expectedTotal
    ) {
        await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
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

            await prisma.orderItem.update({
                where: { id: item.id },
                data: {
                    codes: oldestStock,
                }
            });
        }

        if (order.couponUsed) {
            await prisma.coupon.update({
                where: { code: order.couponUsed },
                data: { usageCount: { increment: 1 } },
            });
        }

        // Fetch the updated order with codes for the email
        const updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                customer: true,
                OrderItem: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!updatedOrder) {
            console.log('Updated order not found');
            return new NextResponse('Updated order not found', { status: 400 });
        }

        await sendOrderCompleteEmail({
            customerName: updatedOrder.customer.name,
            customerEmail: updatedOrder.customer.email,
            orderId: updatedOrder.id,
            totalPrice: updatedOrder.totalPrice,
            paymentFee: updatedOrder.paymentFee,
            totalWithFee: updatedOrder.totalPrice + updatedOrder.paymentFee,
            paymentType: updatedOrder.paymentType,
            orderDate: updatedOrder.createdAt.toISOString(),
            items: updatedOrder.OrderItem.map(i => ({
                name: i.product.name,
                price: i.price,
                quantity: i.quantity,
                codes: i.codes,
                image: i.product.image
            }))
        });
    }

    return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
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
    const expectedTotal = order.totalPrice + order.paymentFee;
    
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

        await sendOrderCompleteEmail({
            customerName: order.customer.name,
            customerEmail: order.customer.email,
            orderId: order.id,
            totalPrice: order.totalPrice,
            paymentFee: order.paymentFee,
            totalWithFee: order.totalPrice + order.paymentFee,
            paymentType: order.paymentType,
            orderDate: order.createdAt.toISOString(),
            items: order.OrderItem.map(i => ({
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
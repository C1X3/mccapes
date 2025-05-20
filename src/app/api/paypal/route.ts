import { parseIPN } from "@/types/paypal";
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
        }
    });

    if (!order) {
        return new NextResponse('OK', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    if (
        ipn.receiverEmail === process.env.NEXT_PUBLIC_PAYPAL_EMAIL &&
        ipn.paymentStatus === 'Completed' &&
        ipn.txnType === 'send_money' &&
        ipn.paymentType === 'instant' &&
        ipn.mcCurrency === 'USD' &&
        ipn.mcGross >= (order.totalPrice + order.paymentFee)
    ) {
        await prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.PAID },
        });
    }

    return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
    });
}
import { CheckoutPayload, WalletDetails } from './types';
import { fAndFItems } from '@/utils/paypalNotes';
import { prisma } from '@/utils/prisma';
import { OrderStatus, PaymentType } from '@generated';

const pickNote = async () => {
    const currPaypalPending = await prisma.order.findMany({
        where: {
            paymentType: PaymentType.PAYPAL,
            status: OrderStatus.PENDING,
        },
        select: { paypalNote: true },
    });
    const usedNotes = new Set(currPaypalPending.map(o => o.paypalNote));

    const unusedSingles = fAndFItems.filter((item) => !usedNotes.has(item));

    const unusedPairs: string[] = [];
    for (let i = 0; i < fAndFItems.length; i++) {
        for (let j = i + 1; j < fAndFItems.length; j++) {
            const combo = `${fAndFItems[i]} ${fAndFItems[j]}`;
            if (!usedNotes.has(combo)) {
                unusedPairs.push(combo);
            }
        }
    }

    const candidates = unusedSingles.length > 0 ? unusedSingles : unusedPairs;

    // If no candidates remain, throw an error:
    if (candidates.length === 0) {
        throw new Error(
            'No note found—even after trying all single+pair combinations'
        );
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
};

export async function createCheckoutSession(payload: CheckoutPayload): Promise<WalletDetails> {
    if (!process.env.NEXT_PUBLIC_PAYPAL_EMAIL) {
        throw new Error('PAYPAL_EMAIL is not set');
    }

    const email = process.env.NEXT_PUBLIC_PAYPAL_EMAIL;
    const totalPrice = payload.totalPrice;

    const discountInfo = payload.discountAmount && payload.discountAmount > 0
        ? ` (Discount: $${payload.discountAmount.toFixed(2)}${payload.couponCode ? ` - Coupon: ${payload.couponCode}` : ''})`
        : '';

    const amount = totalPrice.toFixed(2);
    const paymentDetailsNote = `Order #${payload.orderId}${discountInfo}`;

    const paypalNote = await pickNote();
    await prisma.order.update({
        where: { id: payload.orderId },
        data: {
            paypalNote: paypalNote,
            totalPrice,
        },
    });

    return {
        address: email,
        amount,
        url: paypalNote,
        note: paymentDetailsNote,
    };
}

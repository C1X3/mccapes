import { CheckoutPayload, WalletDetails } from './types';
import { fAndFItems } from '@/utils/paypalNotes';
import { prisma } from '@/utils/prisma';
import { OrderStatus, PaymentType } from '@generated';

export async function createCheckoutSession(payload: CheckoutPayload): Promise<WalletDetails> {
    if (!process.env.NEXT_PUBLIC_PAYPAL_EMAIL) {
        throw new Error('PAYPAL_EMAIL is not set');
    }
    const email = process.env.NEXT_PUBLIC_PAYPAL_EMAIL;

    // Use the total price from the payload which should already have the discount applied
    const totalPrice = payload.totalPrice;

    // For clarity in the transaction details, include discount information
    const discountInfo = payload.discountAmount && payload.discountAmount > 0
        ? ` (Discount: $${payload.discountAmount.toFixed(2)}${payload.couponCode ? ` - Coupon: ${payload.couponCode}` : ''})`
        : '';

    const amount = totalPrice.toFixed(2);
    const paymentDetailsNote = `Order #${payload.orderId}${discountInfo}`;

    // fetch all pending PayPal orders' notes
    const currPaypalPending = await prisma.order.findMany({
        where: {
            paymentType: PaymentType.PAYPAL,
            status: OrderStatus.PENDING,
        },
        select: { paypalNote: true },
    });
    const usedNotes = new Set(currPaypalPending.map(o => o.paypalNote));

    // ───────────────────────────────
    // Build a list of all unused single‐item notes:
    const unusedSingles = fAndFItems.filter((item) => !usedNotes.has(item));

    // Build a list of all unused two‐item combinations:
    const unusedPairs: string[] = [];
    for (let i = 0; i < fAndFItems.length; i++) {
        for (let j = i + 1; j < fAndFItems.length; j++) {
            const combo = `${fAndFItems[i]} ${fAndFItems[j]}`;
            if (!usedNotes.has(combo)) {
                unusedPairs.push(combo);
            }
        }
    }

    // Prioritize single-word notes, only use pairs if no singles are available
    const candidates = unusedSingles.length > 0 ? unusedSingles : unusedPairs;

    // If no candidates remain, throw an error:
    if (candidates.length === 0) {
        throw new Error(
            'No note found—even after trying all single+pair combinations'
        );
    }

    // Pick one at random:
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const note = candidates[randomIndex];
    // ───────────────────────────────

    // persist the chosen note on the order
    await prisma.order.update({
        where: { id: payload.orderId },
        data: {
            paypalNote: note,
            totalPrice: totalPrice, // Ensure the order has the discounted price
        },
    });

    return {
        address: email,
        amount,
        url: note,
        note: paymentDetailsNote,
    };
}

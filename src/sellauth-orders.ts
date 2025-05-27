// importOrders.ts

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { PrismaClient, PaymentType, OrderStatus } from '@generated';

const prisma = new PrismaClient();

function mapPaymentMethod(method: string): PaymentType {
    const m = method.toLowerCase();
    if (m.includes('stripe')) return PaymentType.STRIPE;
    if (m.includes('bitcoin') || m.includes('litecoin')) return PaymentType.CRYPTO;
    if (m.includes('paypal')) return PaymentType.PAYPAL;
    throw new Error(`Unknown payment method "${method}"`);
}

function mapOrderStatus(status: string): OrderStatus {
    const s = status.toLowerCase();
    if (s === 'pending') return OrderStatus.PENDING;
    if (s === 'completed') return OrderStatus.PAID;
    if (s === 'cancelled') return OrderStatus.CANCELLED;
    throw new Error(`Unknown order status "${status}"`);
}

async function main() {
    const filePath = path.resolve(__dirname, 'invoices-mccapes-2025-05-24.csv');
    const stream = fs.createReadStream(filePath).pipe(csvParser());

    for await (const row of stream) {
        try {
            const customerId = row['Customer ID'];
            const customerEmail = row['E-mail Address'];
            const customerName = customerEmail.split('@')[0];
            const discordName = row['Discord Username'] || undefined;
            const ipAddress = row['IP Address'] || undefined;
            const useragent = row['User Agent'] || undefined;

            // upsert customer
            const customer = await prisma.customerInformation.create({
                data: {
                    email: customerEmail,
                    name: customerName,
                    discord: discordName,
                    ipAddress,
                    useragent
                }
            });

            // build order data
            const orderId = row['Unique ID'];
            const totalPrice = parseFloat(row['Total']);
            const paymentFee = parseFloat(row['Gateway Fee'] || '0');
            const couponDisc = parseFloat(row['Coupon Discount'] || '0');
            const createdAt = new Date(row['Created At']);
            const completedAt = row['Completed At'] ? new Date(row['Completed At']) : undefined;

            const order = await prisma.order.create({
                data: {
                    totalPrice,
                    paymentFee,
                    paymentType: mapPaymentMethod(row['Payment Method']),
                    status: mapOrderStatus(row['Status']),
                    couponUsed: null,               // no coupon code in CSV
                    discountAmount: couponDisc,
                    createdAt,
                    updatedAt: completedAt,
                    customer: { connect: { id: customer.id } }
                }
            });

            // parse up to 20 items
            for (let i = 1; i <= 20; i++) {
                const pidField = `Item ${i} Product ID`;
                if (!row[pidField]) continue;    // no more items

                const productId = row[pidField];
                const quantity = parseInt(row[`Item ${i} Quantity`], 10) || 1;
                const price = parseFloat(row[`Item ${i} Total Price`] || '0');
                // attempt to grab codes array from either Custom Fields or Delivered column
                let codes: string[] = [];
                const cf = row[`Item ${i} Custom Fields`];
                const dv = row[`Item ${i} Delivered`];
                try {
                    if (cf?.trim().startsWith('[')) codes = JSON.parse(cf);
                    else if (dv?.trim().startsWith('[')) codes = JSON.parse(dv);
                } catch (e) {
                    console.warn(`→ row ${orderId} item ${i}: failed to parse codes JSON`, e);
                }

                await prisma.orderItem.create({
                    data: {
                        order: { connect: { id: order.id } },
                        product: { connect: { id: productId } },
                        quantity,
                        price,
                        codes
                    }
                });
            }

            console.log(`Imported order ${orderId} with customer ${customerId}`);
        } catch (err) {
            console.error(`Error processing row ${row['Unique ID']}:`, err);
        }
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());

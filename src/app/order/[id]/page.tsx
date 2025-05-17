import { prefetch, trpc } from "@/server/server";
import { prisma } from "@/utils/prisma";
import OrderPage from "@/views/order/OrderPage";
import { OrderStatus } from "@generated";
import { redirect } from "next/navigation";

const Page = async ({ params, searchParams }: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
    const id = (await params).id;
    const canceled = (await searchParams).canceled === "true";

    if (!id) redirect("/");

    if (id && canceled) {
        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: {
                    OrderItem: true,
                }
            });

            if (!order) return;

            for (const item of order.OrderItem) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) return;

                const stock = product.stock.concat(item.codes);
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock },
                });
            }

            await tx.order.update({
                where: { id },
                data: { status: OrderStatus.CANCELLED },
            });
        });
    }

    prefetch(trpc.checkout.getCryptoWalletDetails.queryOptions({ orderId: id }));
    prefetch(trpc.checkout.getOrderStatus.queryOptions({ orderId: id }));

    return <OrderPage id={id} />;
};

export default Page;
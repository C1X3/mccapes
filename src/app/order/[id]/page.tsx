import { HydrateClient, prefetch, trpc } from "@/server/server";
import { prisma } from "@/utils/prisma";
import OrderPage from "@/views/order/OrderPage";
import { OrderStatus } from "@generated/client";
import { redirect } from "next/navigation";

const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const id = (await params).id;
  const canceled = (await searchParams).canceled === "true";

  if (!id) redirect("/");

  if (id && canceled) {
    await prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  prefetch(trpc.checkout.getOrderStatus.queryOptions({ orderId: id }));

  return (
    <HydrateClient>
      <OrderPage id={id} />
    </HydrateClient>
  );
};

export const dynamic = "force-dynamic";

export default Page;

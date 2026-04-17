import { HydrateClient, prefetch, trpc } from "@/server/server";
import { prisma } from "@/utils/prisma";
import OrderPage from "@/views/order/OrderPage";
import { OrderStatus } from "@generated/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const id = (await params).id;
  const resolvedSearchParams = await searchParams;
  const canceled = resolvedSearchParams.canceled === "true";
  const paypalToken =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
      : Array.isArray(resolvedSearchParams.token)
        ? resolvedSearchParams.token[0]
        : undefined;

  if (!id) redirect("/");

  if (id && canceled) {
    await prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
    redirect(`/order/${id}`);
  }

  if (id && paypalToken) {
    try {
      const reqHeaders = await headers();
      const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host");
      const protocol = reqHeaders.get("x-forwarded-proto") || "http";

      if (!host) {
        throw new Error("Missing host header for PayPal capture callback");
      }

      const captureResponse = await fetch(`${protocol}://${host}/api/paypal-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "capture",
          orderId: id,
          paypalOrderId: paypalToken,
        }),
        cache: "no-store",
      });

      if (captureResponse.status === 409) {
        const declineResult = (await captureResponse.json()) as {
          recoverableDecline?: boolean;
          retryUrl?: string;
        };
        if (declineResult.recoverableDecline && declineResult.retryUrl) {
          redirect(declineResult.retryUrl as never);
        }
      }

      if (!captureResponse.ok) {
        throw new Error(`Capture request failed with status ${captureResponse.status}`);
      }
    } catch (error) {
      console.error("PayPal checkout capture on return failed:", error);
    }

    redirect(`/order/${id}`);
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

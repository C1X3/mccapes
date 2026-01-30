import { HydrateClient, prefetch, trpc } from "@/server/server";
import ShopPage from "@/views/shop/ShopPage";
import { Suspense } from "react";

const Page = async () => {
  prefetch(
    trpc.product.getAll.queryOptions({
      isProductPage: true,
    }),
  );

  return (
    <HydrateClient>
      <Suspense>
        <ShopPage />
      </Suspense>
    </HydrateClient>
  );
};

export const dynamic = "force-dynamic";

export default Page;

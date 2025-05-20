import { HydrateClient, prefetch, trpc } from "@/server/server";
import ShopPage from "@/views/shop/ShopPage";

const Page = async () => {
    prefetch(
        trpc.product.getAll.queryOptions({
            isProductPage: true,
        })
    );

    return (
        <HydrateClient>
            <ShopPage />
        </HydrateClient>
    );
};

export const dynamic = "force-dynamic";

export default Page;
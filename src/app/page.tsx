import { HydrateClient, prefetch, trpc } from "@/server/server";
import HomePage from "@/views/homepage";

const Page = async () => {
  prefetch(
    trpc.product.getAll.queryOptions({ isHomePage: true })
  );

  return (
    <HydrateClient>
      <HomePage />
    </HydrateClient>
  );
};

export const dynamic = "force-dynamic";

export default Page;
import { prisma } from "@/utils/prisma";
import ProductPage from "@/views/product/ProductPage";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const id = (await params).id;
    const product = await prisma.product.findUnique({
        where: {
            id,
        },
    });

    const stockCount = product?.stock.length;
    if (!product) return null;

    product.stock = [];

    return <ProductPage product={product || undefined} stockCount={stockCount} />;
};

export default Page;
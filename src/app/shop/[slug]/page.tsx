import { prisma } from "@/utils/prisma";
import ProductPage from "@/views/product/ProductPage";

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      image: true,
      additionalImages: true,
      productType: true,
      backgroundImageUrl: true,
      capeTexturePng: true,
      category: true,
      rating: true,
      badge: true,
      features: true,
      stock: true,
      order: true,
      stripeProductName: true,
      slashPrice: true,
      hideHomePage: true,
      hideProductPage: true,
      isFeatured: true,
      stripeId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const stockCount = product?.stock.length;
  if (!product) return null;

  const productForPage = {
    ...product,
    capeTextureDataUrl:
      product.productType === "CAPE" && product.capeTexturePng
        ? `data:image/png;base64,${Buffer.from(product.capeTexturePng).toString("base64")}`
        : null,
    stock: [],
  };

  return <ProductPage product={productForPage || undefined} stockCount={stockCount} />;
};

export default Page;

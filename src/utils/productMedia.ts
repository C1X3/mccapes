export const DEFAULT_PRODUCT_BACKGROUND_IMAGE = "/mc_bg.webp";
export type ProductBackgroundBlurPreset = "default" | "compact";

type MediaProduct = {
  slug?: string | null;
  productType?: "CAPE" | "STANDARD" | null;
  capeTextureDataUrl?: string | null;
  backgroundImageUrl?: string | null;
  image?: string | null;
};

export const isCapeProduct = (product: MediaProduct) =>
  (product.productType ?? "CAPE") === "CAPE";

export const resolveProductBackgroundImage = (product: MediaProduct) =>
  product.backgroundImageUrl || DEFAULT_PRODUCT_BACKGROUND_IMAGE;

export const resolveCapeTexturePath = (product: MediaProduct) => {
  if (product.capeTextureDataUrl) return product.capeTextureDataUrl;
  const slug = product.slug || "experience";
  return `/cape renders/${slug}.png`;
};

export const getProductBackgroundBlurClasses = (
  preset: ProductBackgroundBlurPreset = "default",
) =>
  preset === "compact"
    ? "scale-130 saturate-120 blur-[1.5px]"
    : "scale-140 saturate-120 blur-[3px]";

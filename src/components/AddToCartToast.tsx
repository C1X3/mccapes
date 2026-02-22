"use client";

import ProductCapeViewer from "@/components/ProductCapeViewer";
import { Product } from "@/utils/cart";
import {
  getProductBackgroundBlurClasses,
  isCapeProduct,
  resolveCapeTexturePath,
  resolveProductBackgroundImage,
} from "@/utils/productMedia";
import Image from "next/image";

type AddToCartToastProps = {
  product: Product;
  quantity: number;
  onViewCart: () => void;
};

export default function AddToCartToast({ product, quantity, onViewCart }: AddToCartToastProps) {
  const cape = isCapeProduct(product);

  return (
    <div className="w-[360px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-28 overflow-hidden rounded-xl border border-[var(--border)]">
          <div
            className={`pointer-events-none absolute inset-0 bg-cover bg-center ${getProductBackgroundBlurClasses("compact")}`}
            style={{ backgroundImage: `url('${resolveProductBackgroundImage(product)}')` }}
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0">
            {cape ? (
              <ProductCapeViewer texturePath={resolveCapeTexturePath(product)} compact variant="shop-card" />
            ) : (
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">Added to cart</p>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--foreground)]">{product.name}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Qty: {quantity}</p>
          <button
            type="button"
            onClick={onViewCart}
            className="mt-3 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)]"
          >
            View cart
          </button>
        </div>
      </div>
    </div>
  );
}

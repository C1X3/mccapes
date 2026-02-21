import { motion } from "framer-motion";
import Image from "next/image";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ProductGetAllOutput } from "@/server/routes/_app";
import { useMemo, useState, type MouseEvent } from "react";
import ProductCapeViewer from "@/components/ProductCapeViewer";

type CardStyle = "normal" | "article";

const renderRating = (rating: number, score?: number | null) => (
  <div className="flex items-center gap-2">
    <div className="flex text-[var(--color-warning)] mr-1">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          size={12}
          className={
            i < rating
              ? "text-[var(--color-warning)]"
              : "text-[var(--color-gray-500)]"
          }
        />
      ))}
    </div>
    <span className="text-xs text-[var(--color-text-muted)]">
      {score?.toFixed(1) ?? "4.8"}
    </span>
  </div>
);

const CapeImage = ({
  slug,
  compact,
  isHovered = false,
}: {
  slug: string;
  compact?: boolean;
  isHovered?: boolean;
}) => {
  return (
    <div className="absolute inset-0">
      <Image
        src="/mc_bg.webp"
        alt=""
        fill
        priority={false}
        className={`object-cover scale-140 saturate-120 ${compact ? "blur-[2px]" : "blur-sm"}`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),rgba(0,0,0,0.28))]" />

      <motion.div
        className="absolute inset-0"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.25 }}
      >
        <div className="absolute inset-0">
          <ProductCapeViewer
            texturePath={`/cape renders/${slug}.png`}
            compact={Boolean(compact)}
            variant="shop-card"
            isHovered={isHovered}
          />
        </div>
      </motion.div>
    </div>
  );
};

const ProductCard = ({
  product,
  styles = "normal",
}: {
  product: ProductGetAllOutput[number] | undefined | null;
  styles?: CardStyle;
}) => {
  const router = useRouter();
  const { addItem } = useCart();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const pointerCapable = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer:fine)").matches;
  }, []);

  if (!product) return null;

  const handleNavigateToProduct = () => {
    router.push(`/shop/${product.slug}`);
  };

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleTiltMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!pointerCapable || styles !== "normal") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: -y * 4.5, y: x * 5.5 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const rating = Math.max(0, Math.min(5, Math.floor(product.rating || 0)));

  if (styles === "article") {
    return (
      <motion.div
        key={product.id}
        onClick={handleNavigateToProduct}
        className="group flex cursor-pointer items-center gap-5 rounded-2xl border border-[var(--border)] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--surface),#fff_5%),color-mix(in_srgb,var(--surface),#000_8%))] p-4 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--primary),#fff_30%)] hover:shadow-[0_16px_35px_rgba(0,0,0,0.32)]"
        whileHover={{ y: -4 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-24 w-1/3 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[radial-gradient(circle_at_20%_20%,rgba(57,203,115,0.2),transparent_42%),radial-gradient(circle_at_90%_90%,rgba(84,184,255,0.16),transparent_48%)]">
          <CapeImage slug={product.slug} compact isHovered={isHovered} />
        </div>

        <div className="flex h-full flex-1 flex-col justify-between">
          <div>
            {renderRating(rating, product.rating)}
            <h4 className="mt-1 text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-light)]">
              {product.name}
            </h4>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xl font-bold text-[var(--foreground)]">
              ${product.price}
              {product.slashPrice && (
                <span className="ml-2 text-sm text-[var(--color-text-muted)] line-through">
                  ${product.slashPrice.toFixed(2)}
                </span>
              )}
            </span>
            <button
              onClick={handleAddToCart}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-lg bg-[var(--primary)] p-2 text-[var(--text-on-primary)] transition hover:brightness-110"
            >
              <FaShoppingCart size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={product.id}
      className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--surface),#fff_4%),color-mix(in_srgb,var(--surface),#000_9%))] overflow-hidden"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      onClick={handleNavigateToProduct}
      onMouseMove={handleTiltMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        resetTilt();
      }}
      style={{
        transformStyle: "preserve-3d",
        transform:
          pointerCapable && styles === "normal"
            ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : undefined,
      }}
    >
      <div className="relative h-60 overflow-hidden border-b border-[var(--border)] bg-[radial-gradient(circle_at_20%_20%,rgba(57,203,115,0.2),transparent_42%),radial-gradient(circle_at_90%_90%,rgba(84,184,255,0.16),transparent_48%)]">
        <CapeImage slug={product.slug} isHovered={isHovered} />

        {product.badge && (
          <div className="absolute left-3 top-3 z-10 rounded-full border border-[color-mix(in_srgb,var(--primary),#fff_20%)] bg-[var(--primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            {product.badge}
          </div>
        )}
      </div>

      <div className="p-5">
        {renderRating(rating, product.rating)}
        <h4 className="mb-2 mt-2 text-2xl text-[var(--foreground)] group-hover:text-[var(--accent-light)]">
          {product.name}
        </h4>
        <p className="mb-5 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[var(--foreground)]">
            ${product.price}
            {product.slashPrice && (
              <span className="ml-2 text-sm line-through text-[var(--color-text-muted)]">
                ${product.slashPrice.toFixed(2)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex items-center rounded-xl bg-[linear-gradient(135deg,var(--primary-dark),var(--primary))] p-2.5 text-[var(--text-on-primary)] shadow-[0_10px_24px_rgba(57,203,115,0.22)] transition hover:brightness-110"
          >
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
              <FaShoppingCart size={16} />
            </motion.div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

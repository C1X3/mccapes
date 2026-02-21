"use client";

import HeroCapeStage from "@/components/three/HeroCapeStage";
import { useCart } from "@/context/CartContext";
import { ProductGetAllOutput } from "@/server/routes/_app";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const HeroSection = ({
  heroProducts,
}: {
  heroProducts: ProductGetAllOutput;
}) => {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeProducts = useMemo(
    () => heroProducts.filter((product) => !product.hideHomePage),
    [heroProducts],
  );
  const normalizedIndex =
    activeProducts.length > 0 ? activeIndex % activeProducts.length : 0;
  const activeProduct = activeProducts[normalizedIndex] ?? activeProducts[0];

  useEffect(() => {
    if (activeProducts.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeProducts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeProducts.length]);

  const handleBuyHeroCape = () => {
    if (!activeProduct) return;
    addItem(activeProduct, 1);
    router.push("/cart");
  };

  const handleOpenActiveProduct = () => {
    if (!activeProduct) return;
    router.push(`/shop/${activeProduct.slug}`);
  };

  return (
    <section className="relative -mt-3 w-full overflow-visible px-4 pb-10 pt-0 md:-mt-4 md:px-8 md:pb-12 md:pt-0 lg:min-h-[calc(100svh-6rem)]">
      <div className="container mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 items-center gap-8 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1fr_1fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 mx-auto w-full max-w-xl lg:order-1"
          >

            <AnimatePresence mode="wait">
              <motion.div
                key={activeProduct?.id ?? "hero-copy-default"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <h2 className="mb-3 text-3xl font-extrabold text-[var(--foreground)] md:text-7xl">
                  The {activeProduct?.name ?? "Cape Code"}
                </h2>
                <p className="max-w-xl text-base text-[var(--color-text-secondary)] md:text-lg">
                  {activeProduct?.description ??
                    "Purchase a redeemable Minecraft cape code at competitive community pricing without risky third-party marketplaces."}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-end justify-between gap-6 border-b border-[var(--border)] pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProduct?.id ?? "hero-price-default"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <p className="text-sm uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                    {activeProduct?.name ?? "Cape Code"}
                  </p>
                  <p className="text-5xl font-bold text-[var(--foreground)]">
                    {activeProduct ? `$${activeProduct.price.toFixed(2)}` : "..."}
                  </p>
                </motion.div>
              </AnimatePresence>

              <motion.button
                className="minecraft-btn px-6 py-2.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyHeroCape}
                disabled={!activeProduct}
              >
                Buy Now
              </motion.button>
            </div>

            <p className="mt-4 max-w-xl text-xs text-[var(--color-text-muted)]">
              MCCapes is not affiliated with Mojang, Minecraft, or Microsoft.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.55 }}
            className="relative z-10 flex h-[460px] w-full items-center justify-center md:h-[620px] lg:order-2 lg:h-[68vh]"
          >
            <button
              type="button"
              onClick={handleOpenActiveProduct}
              className="h-full w-[min(88vw,430px)] md:w-[min(56vw,470px)] lg:w-[min(34vw,500px)] aspect-[10/16] cursor-pointer"
              aria-label={
                activeProduct
                  ? `View ${activeProduct.name} product page`
                  : "View product page"
              }
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProduct?.slug ?? "hero-cape-default"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="h-full w-full"
                >
                  <HeroCapeStage
                    quality="auto"
                    interactive
                    texturePath={
                      activeProduct
                        ? `/cape renders/${activeProduct.slug}.png`
                        : "/cape renders/experience-cape.png"
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

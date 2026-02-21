"use client";

import HeroCapeStage from "@/components/three/HeroCapeStage";
import { useCart } from "@/context/CartContext";
import { ProductGetAllOutput } from "@/server/routes/_app";
import {
  FALLBACK_HERO_CAPE_COLOR,
  getCachedCapeAccentColor,
  getCapeAccentColor,
} from "@/utils/capeAccentColor";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const HERO_FALLBACK_PRODUCT = {
  id: "hero-fallback",
  slug: "experience",
  name: "Experience Cape Code",
  description:
    "Purchase a redeemable Minecraft cape code at competitive community pricing without risky third-party marketplaces.",
  price: 9.99,
  slashPrice: 14.99,
};

const HeroSection = ({
  heroProducts,
}: {
  heroProducts: ProductGetAllOutput;
}) => {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [colorCache, setColorCache] = useState<Record<string, string>>({});

  const activeProducts = useMemo(
    () => heroProducts.filter((product) => !product.hideHomePage),
    [heroProducts],
  );
  const hasRealProducts = activeProducts.length > 0;
  const heroDisplayProducts = hasRealProducts ? activeProducts : [HERO_FALLBACK_PRODUCT];
  const normalizedIndex =
    heroDisplayProducts.length > 0 ? activeIndex % heroDisplayProducts.length : 0;
  const activeProduct = heroDisplayProducts[normalizedIndex] ?? heroDisplayProducts[0];
  const activeProductName = activeProduct?.name?.trim() ?? "Cape Code";
  const capeCodeMatch = activeProductName.match(/^(.*?)\s*Cape Code$/i);
  const productPrefix = capeCodeMatch?.[1]?.trim() ?? "";
  const heroTopWord = productPrefix || "";
  const activeSlug = activeProduct?.slug;
  const accentWordColor = activeSlug
    ? (colorCache[activeSlug] ??
      getCachedCapeAccentColor(activeSlug) ??
      FALLBACK_HERO_CAPE_COLOR)
    : FALLBACK_HERO_CAPE_COLOR;

  useEffect(() => {
    const slug = activeSlug;
    if (!slug) return;
    const cached = colorCache[slug];
    if (cached) return;
    const utilCached = getCachedCapeAccentColor(slug);
    if (utilCached) return;

    let cancelled = false;
    getCapeAccentColor(slug).then((color) => {
      if (cancelled) return;
      setColorCache((prev) => (prev[slug] ? prev : { ...prev, [slug]: color }));
    });

    return () => {
      cancelled = true;
    };
  }, [activeSlug, colorCache]);

  useEffect(() => {
    if (activeProducts.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeProducts.length]);

  const handleBuyHeroCape = () => {
    if (!hasRealProducts || !activeProduct) {
      router.push("/shop/experience");
      return;
    }
    addItem(activeProduct, 1);
    router.push("/cart");
  };

  const handleOpenActiveProduct = () => {
    if (!activeProduct) return;
    router.push(`/shop/${activeProduct.slug}`);
  };

  return (
    <section className="relative -mt-3 w-full overflow-visible px-4 pb-8 pt-0 md:-mt-4 md:px-8 md:pb-12 md:pt-0 lg:min-h-[calc(100svh-6rem)]">
      <div className="container mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 items-center gap-6 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1fr_1fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 mx-auto w-full max-w-xl order-2 lg:order-1"
          >

            <AnimatePresence mode="wait">
                <motion.div
                  key={activeProduct?.id ?? "hero-copy-default"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: "easeInOut" }}
              >
                <h2 className="mb-2 text-4xl text-[var(--foreground)] md:mb-3 md:text-6xl lg:text-7xl">
                  <span className="block whitespace-nowrap">
                    The{" "}
                    {heroTopWord ? (
                      <span style={{ color: accentWordColor }}>{heroTopWord}</span>
                    ) : null}
                  </span>
                  <span className="block">Cape Code</span>
                </h2>
                <p className="max-w-xl h-[6.4em] overflow-hidden text-sm leading-[1.65] text-[var(--color-text-secondary)] md:h-[6.8em] md:text-lg md:leading-[1.7]">
                  {activeProduct?.description ??
                    "Purchase a redeemable Minecraft cape code at competitive community pricing without risky third-party marketplaces."}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-end justify-between gap-3 border-b border-[var(--border)] pb-5 md:mt-8 md:gap-6 md:pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProduct?.id ?? "hero-price-default"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="min-w-0"
                >
                  <p className="hidden text-sm uppercase tracking-[0.1em] text-[var(--color-text-muted)] md:block">
                    {activeProduct?.name ?? "Cape Code"}
                  </p>
                  <div className="flex items-end gap-3">
                    <span
                      className="block font-bold leading-none text-[var(--foreground)]"
                      style={{ fontSize: "3rem" }}
                    >
                      ${activeProduct.price.toFixed(2)}
                    </span>
                    {activeProduct?.slashPrice ? (
                      <span className="pb-1 text-sm font-semibold text-rose-400 line-through md:pb-2 md:text-xl">
                        ${activeProduct.slashPrice.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </motion.div>
              </AnimatePresence>

              <motion.button
                className="minecraft-btn shrink-0 whitespace-nowrap px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyHeroCape}
              >
                Buy Now
              </motion.button>
            </div>

            <p className="mt-3 max-w-xl text-[11px] text-[var(--color-text-muted)] md:mt-4 md:text-xs">
              MCCapes is not affiliated with Mojang, Minecraft, or Microsoft.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.55 }}
            className="relative z-10 flex h-[370px] w-full items-center justify-center order-1 md:h-[620px] lg:order-2 lg:h-[68vh]"
          >
            <button
              type="button"
              onClick={handleOpenActiveProduct}
              className="relative h-full w-[min(74vw,330px)] md:w-[min(56vw,470px)] lg:w-[min(34vw,500px)] aspect-[10/16] cursor-pointer"
              aria-label={
                activeProduct
                  ? `View ${activeProduct.name} product page`
                  : "View product page"
              }
            >
              <AnimatePresence mode="sync">
                <motion.div
                  key={activeProduct?.slug ?? "hero-cape-default"}
                  initial={{ opacity: 0, rotateY: -360, scale: 0.985 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, rotateY: 360, scale: 0.985 }}
                  transition={{
                    rotateY: { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] },
                    scale: { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] },
                    opacity: { duration: 0.3, ease: "easeInOut", delay: 0.04 },
                  }}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    transformStyle: "preserve-3d",
                    willChange: "transform, opacity",
                  }}
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

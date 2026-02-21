"use client";

import { useState, useMemo } from "react";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCapeViewer from "@/components/ProductCapeViewer";
import { FaSearch } from "react-icons/fa";
import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const ShopPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const { addItem } = useCart();
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery(
    trpc.product.getAll.queryOptions({
      isProductPage: true,
    }),
  );

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get("search") ?? "",
  );
  const [isFeaturedHovered, setIsFeaturedHovered] = useState(false);
  const [featuredTilt, setFeaturedTilt] = useState({ x: 0, y: 0 });

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    // Sort products by order (lower numbers appear first)
    result = [...result].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return result;
  }, [products, selectedCategory, searchQuery]);

  const topProduct = useMemo(() => {
    const featuredProduct = products.find((x) => x.isFeatured);
    if (featuredProduct) return featuredProduct;

    return filteredProducts.length > 0
      ? filteredProducts.sort((a, b) => b.price - a.price)[0]
      : products.length > 0
        ? products.sort((a, b) => b.price - a.price)[0]
        : null;
  }, [filteredProducts, products]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!topProduct) return;
    addItem(topProduct, 1);
  };

  const handleFeaturedTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setFeaturedTilt({ x: -y * 4.5, y: x * 5.5 });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />
      {/* Header */}
      <header className="relative z-10 py-8 flex flex-col items-center">
        <div className="container mx-auto px-4 pt-16 text-center">
          <h1 className="mb-4 text-5xl text-[var(--foreground)] md:text-6xl lg:text-7xl">
            Our Products
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Discover our curated collection of high-quality products.
          </p>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Premium Product Spotlight */}
        {topProduct && (
          <motion.div
            className="mb-20 cursor-pointer bg-gradient-to-r from-[color-mix(in_srgb,var(--background),#333_10%)] to-[color-mix(in_srgb,var(--background),#000_10%)] p-4 md:p-8 rounded-3xl backdrop-blur-sm border border-[color-mix(in_srgb,var(--foreground),var(--background)_80%)]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{
              y: -8,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              borderColor: "var(--accent)",
            }}
            transition={{ duration: 0.7, delay: 0.2 }}
            onClick={() => router.push(`/shop/${topProduct.slug}`)}
            onMouseEnter={() => setIsFeaturedHovered(true)}
            onMouseLeave={() => {
              setIsFeaturedHovered(false);
              setFeaturedTilt({ x: 0, y: 0 });
            }}
            onMouseMove={handleFeaturedTilt}
            style={{
              transformStyle: "preserve-3d",
              transform: `perspective(900px) rotateX(${featuredTilt.x}deg) rotateY(${featuredTilt.y}deg)`,
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-10">
              <motion.div
                className="w-full md:w-auto relative flex items-center justify-start"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="relative inline-block h-60 aspect-[5/3] overflow-hidden rounded-2xl border border-[var(--border)]">
                  <Image
                    src="/mc_bg.webp"
                    alt=""
                    fill
                    className="object-cover scale-140 blur-[3px] saturate-125"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.14),rgba(0,0,0,0.3))]" />
                  <div className="absolute inset-0">
                    <ProductCapeViewer
                      texturePath={`/cape renders/${topProduct.slug}.png`}
                      compact
                      variant="shop-card"
                      isHovered={isFeaturedHovered}
                    />
                  </div>
                  <div className="absolute top-4 right-4 bg-success text-white px-3 py-1 rounded-full text-sm font-semibold">
                    FEATURED
                  </div>
                </div>
              </motion.div>
              <div className="w-full md:flex-1 space-y-6">
                <h3 className="text-3xl font-bold">{topProduct.name}</h3>
                <div className="flex items-center">
                  <div className="flex text-warning mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        size={16}
                        className={
                          i < Math.floor(topProduct.rating || 5)
                            ? "text-warning"
                            : "text-gray-600"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                    {topProduct.rating}
                  </span>
                </div>
                <p className="text-[color-mix(in_srgb,var(--foreground),#888_30%)] text-lg leading-relaxed">
                  {topProduct.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold">
                      ${topProduct.price}
                    </span>
                    {topProduct.slashPrice && (
                      <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">
                        ${topProduct.slashPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <motion.button
                    onClick={(e) => handleAddToCart(e)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] text-white font-medium py-3 px-6 rounded-xl shadow-lg"
                  >
                    <FaShoppingCart size={18} />
                    Add to Cart
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading & Error States */}
        {isLoading && (
          <div className="text-center py-20">Loading products…</div>
        )}
        {isError && (
          <div className="text-center py-20 text-red-500">
            Error loading products: {error.message}
          </div>
        )}

        {/* Filters */}
        {!isLoading && !isError && (
          <div className="mb-12 bg-[color-mix(in_srgb,var(--background),#333_10%)] p-6 rounded-2xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              {/* Category selector */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_25%)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="w-full md:w-72">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-xl text-[var(--foreground)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                    <FaSearch size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !isError && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                  No products found
                </h3>
                <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                  Try adjusting your search or filter to find what you&apos;re
                  looking for.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ShopPage;

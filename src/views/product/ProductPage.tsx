"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import FAQSection from "@/components/FAQSection";
import { Product } from "@generated/browser";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ProductCapeViewer from "@/components/ProductCapeViewer";
import { useState } from "react";
import {
  FaArrowLeft,
  FaStar,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaBox,
} from "react-icons/fa";
import { useCart } from "@/context/CartContext";

const ProductPage = ({
  product,
  stockCount,
}: {
  product?: Product;
  stockCount?: number;
}) => {
  const router = useRouter();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [capeView, setCapeView] = useState<"cape" | "player" | "elytra">("cape");

  const handleIncrementQuantity = () => {
    if (product && quantity < stockCount!) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    setIsAdding(true);
    addItem({ ...product, stock: stockCount || 0 }, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = () => {
    if (!product) return;

    addItem({ ...product, stock: stockCount || 0 }, quantity);

    router.push("/cart");
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Product not found
          </h2>
          <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] mb-6">
            The product you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="py-8 flex items-center justify-center relative flex-col">
        <Navbar />
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push("/shop")}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-200 text-[color-mix(in_srgb,var(--foreground),#888_40%)] hover:text-[var(--accent)] hover:bg-gray-300 shadow-md border border-gray-300 transition-colors"
        >
          <FaArrowLeft size={14} />
          <span>Back to Shop</span>
        </button>

        {/* Product details: on lg, row 1 = cape render + info */}
        <div className="grid grid-cols-1 gap-x-12 gap-y-4 lg:grid-cols-2">
          {/* Cape render - lg row 1 col 1 */}
          <div className="lg:col-start-1 lg:row-start-1">
            {/* View selector tabs */}
            <div className="flex gap-2 mb-4">
              {(
                [
                  { id: "cape" as const, label: "Cape" },
                  { id: "player" as const, label: "On Player" },
                  { id: "elytra" as const, label: "Elytra" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCapeView(id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    capeView === id
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_25%)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-[1000px] aspect-[1000/700] rounded-2xl overflow-visible bg-[color-mix(in_srgb,var(--background),#000_8%)] border border-[var(--border)]">
              {capeView === "cape" && (
                <div className="absolute inset-0">
                  <ProductCapeViewer texturePath={`/cape renders/${product.slug}.png`} />
                </div>
              )}
              {capeView === "player" && (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)]">
                  <p className="text-center px-6">
                    Cape on player view — coming soon
                  </p>
                </div>
              )}
              {capeView === "elytra" && (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)]">
                  <p className="text-center px-6">
                    Elytra variant view — coming soon
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product information - lg row 1 col 2, same height as image box, content vertically centered */}
          <div className="lg:col-start-2 lg:row-start-1 w-full max-w-[1000px] lg:aspect-[1000/700] flex flex-col justify-center">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] text-xs font-medium rounded-full">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              {product.name}
            </h1>

            <div className="flex items-center mb-6">
              <div className="flex text-warning mr-3">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(product.rating)
                        ? "text-warning"
                        : "text-gray-600"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="text-3xl font-bold text-[var(--foreground)] mb-6">
              ${product.price.toFixed(2)}
              {product.slashPrice && (
                <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">
                  ${product.slashPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mb-6">
              <p className="text-[var(--foreground)] mb-4">
                {product.description}
              </p>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-6">
              {/* Stock status: icon + label + count */}
              <div className="flex items-center gap-3">
                {stockCount! > 10 ? (
                  <FaCheckCircle className="text-green-500 shrink-0" size={24} />
                ) : stockCount! > 0 ? (
                  <FaExclamationTriangle className="text-amber-500 shrink-0" size={24} />
                ) : (
                  <FaTimesCircle className="text-red-500 shrink-0" size={24} />
                )}
                <div>
                  <span
                    className={`font-semibold ${stockCount! > 10 ? "text-green-600" : stockCount! > 0 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {stockCount! > 10
                      ? "In Stock"
                      : stockCount! > 0
                        ? "Low Stock"
                        : "Out of Stock"}
                  </span>
                  {stockCount! > 0 ? (
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="font-medium tabular-nums text-[var(--foreground)]">{stockCount}</span> units left in stock
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-0.5">Currently unavailable</p>
                  )}
                </div>
              </div>

              {stockCount! > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-300" aria-hidden />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Quantity</span>
                    <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden bg-white">
                      <button
                        onClick={handleDecrementQuantity}
                        disabled={quantity <= 1}
                        className="h-10 w-10 flex items-center justify-center text-[var(--foreground)] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <FaMinus size={12} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={stockCount}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= stockCount!) {
                            setQuantity(val);
                          }
                        }}
                        className="h-10 w-12 text-center border-x border-gray-300 bg-transparent text-[var(--foreground)] font-medium tabular-nums outline-none"
                        aria-label="Quantity"
                      />
                      <button
                        onClick={handleIncrementQuantity}
                        disabled={quantity >= stockCount!}
                        className="h-10 w-10 flex items-center justify-center text-[var(--foreground)] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                        aria-label="Increase quantity"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                    {stockCount! < 10 && (
                      <span className="text-sm text-amber-600" role="status">
                        max {stockCount}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={handleAddToCart}
                disabled={stockCount! <= 0 || isAdding}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <span>Adding...</span>
                ) : (
                  <>
                    <FaShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleBuyNow}
                disabled={stockCount! <= 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Frequently Asked Questions</span>
          </h2>
          <p className="text-gray-600">
            Find answers to common questions about our services
          </p>
        </div>
        <FAQSection showTitle={false} showContactButtons={false} />
      </div>

      {/* Customer Stats Section */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Our Customers</span>
          </h2>
          <p className="text-gray-600">
            Join thousands of satisfied Minecraft players worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-[var(--foreground)] mb-2">
              5,792
            </div>
            <div className="text-gray-600 font-medium">Products Sold</div>
          </div>
          <div className="glass-effect rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-[var(--foreground)] mb-2">
              4,187
            </div>
            <div className="text-gray-600 font-medium">Unique Customers</div>
          </div>
          <div className="glass-effect rounded-xl p-8 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-5xl font-bold text-[var(--foreground)] mr-2">
                4.97
              </span>
              <FaStar className="text-warning" size={28} />
            </div>
            <div className="text-gray-600 font-medium">Average Rating</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductPage;

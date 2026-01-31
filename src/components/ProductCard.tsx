import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ProductGetAllOutput } from "@/server/routes/_app";
import { useState, useEffect } from "react";

type CardStyle = "normal" | "article";

const ProductCard = ({
  product,
  styles = "normal",
}: {
  product: ProductGetAllOutput[number];
  styles?: CardStyle;
}) => {
  const router = useRouter();
  const { addItem } = useCart();
  const [isHovering, setIsHovering] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = [product.image, ...(product.additionalImages || [])];
  const hasMultipleImages = allImages.length > 1;

  useEffect(() => {
    if (!hasMultipleImages || !isHovering) {
      setCurrentImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovering, hasMultipleImages, allImages.length]);

  const handleNavigateToProduct = () => {
    router.push(`/shop/${product.slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  // Common rating render
  const Rating = () => (
    <div className="flex items-center">
      <div className="flex text-yellow-400 mr-2">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            size={12}
            className={
              i < Math.floor(product.rating)
                ? "text-yellow-400"
                : "text-gray-600"
            }
          />
        ))}
      </div>
      <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-xs">
        {product.rating}
      </span>
    </div>
  );

  if (styles === "article") {
    // Flat, left-to-right version
    return (
      <motion.div
        key={product.id}
        onClick={handleNavigateToProduct}
        className="group flex items-center gap-6 p-4 rounded-2xl bg-[var(--background)] hover:shadow-lg transition-shadow duration-200 cursor-pointer relative overflow-hidden"
        whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[var(--primary)]"
              style={{
                width: 10 + Math.random() * 50,
                height: 10 + Math.random() * 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 30 - 15],
                y: [0, Math.random() * 30 - 15],
                scale: [1, 1 + Math.random() * 0.2],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Left: Image */}
        <div
          className="relative w-1/3 h-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <motion.div
            className="absolute inset-0"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <AnimatePresence initial={false}>
              <motion.div
                key={currentImageIndex}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={allImages[currentImageIndex]}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col justify-between flex-1 h-full">
          <div>
            <Rating />
            <h4 className="mt-1 text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {product.name}
            </h4>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xl font-bold text-[var(--foreground)]">
              ${product.price}
              {product.slashPrice && (
                <span className="ml-2 text-sm line-through text-[color-mix(in_srgb,var(--foreground),#888_60%)]">
                  ${product.slashPrice.toFixed(2)}
                </span>
              )}
            </span>

            <div className="flex space-x-2">
              <button
                onClick={handleAddToCart}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FaShoppingCart size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default "normal" card (your existing implementation)
  return (
    <motion.div
      key={product.id}
      className="group bg-gradient-to-b from-[color-mix(in_srgb,var(--background),#333_15%)] to-[var(--background)] rounded-2xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] hover:border-[var(--accent)] backdrop-blur-sm cursor-pointer"
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        borderColor: "var(--accent)",
      }}
      onClick={handleNavigateToProduct}
    >
      {/* Image with hover and full-fill effect */}
      <div
        className="relative h-60 overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--primary),#fff_80%)] to-[color-mix(in_srgb,var(--secondary),#fff_80%)] bg-opacity-10"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={currentImageIndex}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={allImages[currentImageIndex]}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
                className="drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        {product.badge && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
            {product.badge}
          </div>
        )}
        {hasMultipleImages && (
          <div className="absolute bottom-3 right-3 flex gap-1 z-10">
            {allImages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <Rating />
        <h4 className="text-lg font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
          {product.name}
        </h4>
        <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--foreground)]">
            ${product.price}
            {product.slashPrice && (
              <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">
                ${product.slashPrice.toFixed(2)}
              </span>
            )}
          </span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="p-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center"
              >
                <FaShoppingCart size={16} />
              </motion.div>
            </button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/shop/${product.slug}`);
              }}
            >
              <span className="text-sm font-semibold">View</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

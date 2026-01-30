import ProductCard from "@/components/ProductCard";
import { ProductGetAllOutput } from "@/server/routes/_app";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FaChevronRight } from "react-icons/fa";

const TopProductsSection = ({
  products,
}: {
  products: ProductGetAllOutput;
}) => {
  const router = useRouter();

  return (
    <section className="py-24 bg-gradient-to-br from-[var(--background)] to-[color-mix(in_srgb,var(--background),#000_15%)] text-[var(--foreground)] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[var(--primary)] rounded-full filter blur-[80px]" />
        <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-[var(--secondary)] rounded-full filter blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-40 h-40 bg-[var(--accent)] rounded-full filter blur-[60px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header with animation */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">
              Customers&apos; Favorites
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 gradient-text">
            Products
          </h2>
          <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] max-w-xl mx-auto text-lg">
            Exclusive in-game items curated for top Minecraft players
          </p>
        </motion.div>

        {/* Product Grid with improved cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>

        {/* Improved CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          onClick={() => router.push("/shop")}
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px rgba(var(--primary-rgb),0.5)",
            }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:from-[color-mix(in_srgb,var(--primary),#000_10%)] hover:to-[color-mix(in_srgb,var(--secondary),#000_10%)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary-rgb)]/30 transition-all"
          >
            Explore All Products
            <FaChevronRight className="ml-2" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default TopProductsSection;

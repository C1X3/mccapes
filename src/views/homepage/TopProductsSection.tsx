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
    <section
      id="our-products"
      className="relative overflow-hidden px-4 py-18 md:px-8 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(57,203,115,0.06),transparent_40%,rgba(84,184,255,0.08))]" />

      <div className="container relative z-10 mx-auto">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#fff_3%)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent-light)]">
            Event Code Catalog
          </span>
          <h2 className="text-5xl text-[var(--foreground)] md:text-6xl lg:text-7xl">
            Our Products
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--color-text-secondary)] md:text-lg">
            Redeemable event cape codes with transparent pricing and trusted
            delivery.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </motion.div>

        <motion.div
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/shop")}
            className="inline-flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--primary),#fff_15%)] bg-[linear-gradient(135deg,var(--primary-dark),var(--primary))] px-8 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-on-primary)] shadow-[0_16px_35px_rgba(57,203,115,0.25)]"
          >
            Explore All Capes
            <FaChevronRight className="text-xs" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default TopProductsSection;
